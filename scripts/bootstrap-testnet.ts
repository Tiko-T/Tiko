import "dotenv/config";

import { db } from "../src/lib/db";
import {
  getCapacityBalance,
  getTokenBalance,
  issueTokensToAddress,
  transferCapacityToAddress,
  waitForTransaction,
} from "../src/lib/ckb/payments";
import { getWalletSet, resolveXudtArgs } from "../src/lib/ckb/wallets";
import { env } from "../src/lib/env";
import { seedCatalog } from "../src/lib/tiko/setup";

const CKB = 100_000_000n;
const MIN_ISSUER_BALANCE = 900n * CKB;
const TARGET_BUYER_CAPACITY = 320n * CKB;
const TARGET_MERCHANT_CAPACITY = 100n * CKB;
const TARGET_SPORE_MINTER_CAPACITY = 2000n * CKB;
const TARGET_BUYER_TOKEN_BALANCE = 100_000n;

function formatCkb(shannons: bigint) {
  return `${Number(shannons) / Number(CKB)} CKB`;
}

async function ensureMinCapacity(params: {
  senderPrivateKey: string;
  receiverAddress: string;
  minimum: bigint;
}) {
  const current = await getCapacityBalance(params.receiverAddress);

  if (current >= params.minimum) {
    return {
      funded: false,
      txHash: null,
      balance: current,
    };
  }

  const deficit = params.minimum - current;
  const deficitInCkb = ((deficit + CKB - 1n) / CKB).toString();
  const transfer = await transferCapacityToAddress(
    params.senderPrivateKey,
    params.receiverAddress,
    deficitInCkb
  );
  await waitForTransaction(transfer.txHash, 1);

  return {
    funded: true,
    txHash: transfer.txHash,
    balance: await getCapacityBalance(params.receiverAddress),
  };
}

async function ensureBuyerTokenBalance(receiverAddress: string, xudtArgs: string) {
  const current = await getTokenBalance(receiverAddress, xudtArgs);

  if (current >= TARGET_BUYER_TOKEN_BALANCE) {
    return {
      issued: false,
      txHash: null,
      balance: current,
    };
  }

  const mint = await issueTokensToAddress(
    TARGET_BUYER_TOKEN_BALANCE - current,
    receiverAddress,
    xudtArgs
  );
  await waitForTransaction(mint.txHash, 1);

  return {
    issued: true,
    txHash: mint.txHash,
    balance: await getTokenBalance(receiverAddress, xudtArgs),
  };
}

async function main() {
  if (env.CKB_NETWORK !== "testnet") {
    throw new Error("This bootstrap script is only intended for CKB_NETWORK=testnet");
  }

  const wallets = await getWalletSet();
  const issuerBalance = await getCapacityBalance(wallets.issuer.address);

  if (issuerBalance < MIN_ISSUER_BALANCE) {
    throw new Error(
      `Issuer wallet ${wallets.issuer.address} has ${formatCkb(
        issuerBalance
      )}. Fund it to at least ${formatCkb(MIN_ISSUER_BALANCE)} first.`
    );
  }

  const xudtArgs = await resolveXudtArgs();
  const merchantFunding = await ensureMinCapacity({
    senderPrivateKey: wallets.issuer.privateKey,
    receiverAddress: wallets.merchant.address,
    minimum: TARGET_MERCHANT_CAPACITY,
  });
  const buyerFunding = await ensureMinCapacity({
    senderPrivateKey: wallets.issuer.privateKey,
    receiverAddress: wallets.buyer.address,
    minimum: TARGET_BUYER_CAPACITY,
  });
  const sporeFunding = await ensureMinCapacity({
    senderPrivateKey: wallets.issuer.privateKey,
    receiverAddress: wallets.sporeMinter.address,
    minimum: TARGET_SPORE_MINTER_CAPACITY,
  });
  const buyerTokens = await ensureBuyerTokenBalance(wallets.buyer.address, xudtArgs);

  const catalog = await seedCatalog();

  console.log(
    JSON.stringify(
      {
        network: env.CKB_NETWORK,
        paymentReceiverAddress: wallets.merchant.address,
        xudtArgs,
        tokenSymbol: env.CKB_TOKEN_SYMBOL,
        tokenDecimals: env.CKB_TOKEN_DECIMALS,
        issuer: {
          address: wallets.issuer.address,
          balance: formatCkb(await getCapacityBalance(wallets.issuer.address)),
        },
        merchant: {
          address: wallets.merchant.address,
          balance: formatCkb(merchantFunding.balance),
          capacityFundingTxHash: merchantFunding.txHash,
        },
        buyer: {
          address: wallets.buyer.address,
          balance: formatCkb(buyerFunding.balance),
          tokenBalance: buyerTokens.balance.toString(),
          capacityFundingTxHash: buyerFunding.txHash,
          tokenIssuanceTxHash: buyerTokens.txHash,
        },
        sporeMinter: {
          address: wallets.sporeMinter.address,
          balance: formatCkb(sporeFunding.balance),
          capacityFundingTxHash: sporeFunding.txHash,
        },
        catalog: {
          merchant: catalog.merchant.slug,
          event: catalog.event.slug,
          product: catalog.product.slug,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
