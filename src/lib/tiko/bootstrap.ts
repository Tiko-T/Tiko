import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { env } from "@/lib/env";
import {
  getCapacityBalance,
  getTokenBalance,
  issueTokensToAddress,
  transferCapacityToAddress,
} from "@/lib/ckb/payments";
import { getWalletSet } from "@/lib/ckb/wallets";

import { seedCatalog } from "./setup";

const execFileAsync = promisify(execFile);

function shannonsToCkb(shannons: bigint) {
  return Number(shannons) / 100_000_000;
}

async function runOffckbCommand(args: string[]) {
  const { stdout, stderr } = await execFileAsync("npx", ["@offckb/cli", ...args], {
    cwd: process.cwd(),
  });

  if (stderr) {
    console.error(stderr);
  }

  return stdout.trim();
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureDevnetCapacity(address: string, minimumCkb: number) {
  const current = await getCapacityBalance(address);
  const requiredShannons = BigInt(minimumCkb) * 100_000_000n;

  if (current >= requiredShannons) {
    return {
      address,
      funded: false,
      balanceCkb: shannonsToCkb(current),
    };
  }

  const deficitCkb = Number((requiredShannons - current + 99_999_999n) / 100_000_000n);
  await runOffckbCommand(["deposit", "--network", "devnet", address, String(deficitCkb)]);
  await sleep(3_000);

  const updated = await getCapacityBalance(address);
  return {
    address,
    funded: true,
    balanceCkb: shannonsToCkb(updated),
  };
}

async function waitForCapacity(address: string, minimumCkb: number) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const balance = await getCapacityBalance(address);

    if (balance >= BigInt(minimumCkb) * 100_000_000n) {
      return balance;
    }

    await sleep(2_000);
  }

  throw new Error(`Timed out waiting for ${address} to reach ${minimumCkb} CKB`);
}

async function ensureCapacityFromIssuer(
  address: string,
  minimumCkb: number,
  issuerPrivateKey: string
) {
  const current = await getCapacityBalance(address);
  const requiredShannons = BigInt(minimumCkb) * 100_000_000n;

  if (current >= requiredShannons) {
    return {
      address,
      funded: false,
      balanceCkb: shannonsToCkb(current),
    };
  }

  const deficitCkb = Number((requiredShannons - current + 99_999_999n) / 100_000_000n);
  await transferCapacityToAddress(issuerPrivateKey, address, String(deficitCkb));
  const updated = await waitForCapacity(address, minimumCkb);

  return {
    address,
    funded: true,
    balanceCkb: shannonsToCkb(updated),
  };
}

export async function bootstrapDevnet() {
  if (env.CKB_NETWORK !== "devnet") {
    throw new Error("Devnet bootstrap can only be used with CKB_NETWORK=devnet");
  }

  const wallets = await getWalletSet();
  await seedCatalog();

  const capacity = [
    await ensureDevnetCapacity(wallets.issuer.address, 3_500),
    await ensureCapacityFromIssuer(
      wallets.merchant.address,
      200,
      wallets.issuer.privateKey
    ),
    await ensureCapacityFromIssuer(wallets.buyer.address, 250, wallets.issuer.privateKey),
    await ensureCapacityFromIssuer(
      wallets.sporeMinter.address,
      1_500,
      wallets.issuer.privateKey
    ),
    await ensureDevnetCapacity(wallets.issuer.address, 1_500),
  ];

  const buyerBalance = await getTokenBalance(wallets.buyer.address);
  const targetBuyerBalance = 100_000n;

  if (buyerBalance < targetBuyerBalance) {
    await issueTokensToAddress(targetBuyerBalance - buyerBalance, wallets.buyer.address);
  }

  return {
    capacity,
    token: {
      buyerAddress: wallets.buyer.address,
      buyerBalance: (await getTokenBalance(wallets.buyer.address)).toString(),
    },
    wallets: {
      issuer: wallets.issuer.address,
      merchant: wallets.merchant.address,
      buyer: wallets.buyer.address,
      sporeMinter: wallets.sporeMinter.address,
    },
  };
}
