import { ChainNetwork, FaucetClaimStatus } from "@prisma/client";
import { ccc } from "@ckb-ccc/core";

import { db } from "@/lib/db";
import { env, toPrismaNetwork } from "@/lib/env";
import { issueTokensToAddress, waitForTransaction } from "@/lib/ckb/payments";
import { cccClient } from "@/lib/ckb/ccc-client";
import { resolveXudtArgs } from "@/lib/ckb/wallets";

export async function validateFaucetAddress(address: string) {
  try {
    await ccc.Address.fromString(address, cccClient);
  } catch {
    throw new Error("Wallet address is invalid for the configured CKB network");
  }

  return address.trim();
}

function claimNetwork() {
  return toPrismaNetwork(env.CKB_NETWORK) as ChainNetwork;
}

function faucetClaimAmountUnits() {
  return BigInt(env.FAUCET_SINGLE_CLAIM_AMOUNT) * 10n ** BigInt(env.CKB_TOKEN_DECIMALS);
}

function faucetWalletCapUnits() {
  return BigInt(env.FAUCET_MAX_PER_WALLET) * 10n ** BigInt(env.CKB_TOKEN_DECIMALS);
}

export async function getFaucetWalletSummary(walletAddress: string) {
  const normalized = await validateFaucetAddress(walletAddress);
  const claims = await db.faucetClaim.findMany({
    where: {
      walletAddress: normalized,
      network: claimNetwork(),
      status: {
        in: [FaucetClaimStatus.SENT, FaucetClaimStatus.PENDING],
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  const claimedAmount = claims.reduce((sum, claim) => sum + BigInt(claim.amount), 0n);
  const remaining = faucetWalletCapUnits() - claimedAmount;

  return {
    walletAddress: normalized,
    claims,
    claimedAmount,
    remainingAmount: remaining > 0n ? remaining : 0n,
    claimAmount: faucetClaimAmountUnits(),
  };
}

export async function claimFaucetTokens(walletAddress: string) {
  if (!env.FAUCET_ENABLED) {
    throw new Error("The faucet is not enabled right now");
  }

  const summary = await getFaucetWalletSummary(walletAddress);
  const claimAmount = faucetClaimAmountUnits();

  if (summary.remainingAmount < claimAmount) {
    throw new Error(
      `This wallet has already reached the faucet limit of ${env.FAUCET_MAX_PER_WALLET} ${env.PRICE_DISPLAY_SYMBOL}`
    );
  }

  const xudtArgs = await resolveXudtArgs();
  const claim = await db.faucetClaim.create({
    data: {
      walletAddress: summary.walletAddress,
      network: claimNetwork(),
      amount: claimAmount.toString(),
      status: FaucetClaimStatus.PENDING,
    },
  });

  try {
    const issued = await issueTokensToAddress(claimAmount, summary.walletAddress, xudtArgs);
    await waitForTransaction(issued.txHash, 1);

    const completed = await db.faucetClaim.update({
      where: { id: claim.id },
      data: {
        status: FaucetClaimStatus.SENT,
        txHash: issued.txHash,
        fulfilledAt: new Date(),
        failureReason: null,
      },
    });

    const updatedSummary = await getFaucetWalletSummary(summary.walletAddress);

    return {
      claim: completed,
      txHash: issued.txHash,
      remainingAmount: updatedSummary.remainingAmount,
      claimAmount,
    };
  } catch (error) {
    await db.faucetClaim.update({
      where: { id: claim.id },
      data: {
        status: FaucetClaimStatus.FAILED,
        failureReason: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}
