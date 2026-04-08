import { ccc, Script } from "@ckb-ccc/core";

import { env } from "@/lib/env";

import { cccClient } from "./ccc-client";

export type ChainAccount = {
  privateKey: string;
  signer: ccc.SignerCkbPrivateKey;
  lockScript: Script;
  address: string;
  pubKey: string;
};

export type WalletSet = {
  issuer: ChainAccount;
  merchant: ChainAccount;
  buyer: ChainAccount;
  sporeMinter: ChainAccount;
};

let walletSetPromise: Promise<WalletSet> | undefined;

function requirePrivateKey(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} is required for CKB-backed flows`);
  }

  return value;
}

async function buildAccount(privateKey: string): Promise<ChainAccount> {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
  const lock = await signer.getAddressObjSecp256k1();

  return {
    privateKey,
    signer,
    lockScript: lock.script,
    address: lock.toString(),
    pubKey: signer.publicKey,
  };
}

export async function getWalletSet(): Promise<WalletSet> {
  if (!walletSetPromise) {
    walletSetPromise = Promise.all([
      buildAccount(requirePrivateKey(env.CKB_ISSUER_PRIVATE_KEY, "CKB_ISSUER_PRIVATE_KEY")),
      buildAccount(
        requirePrivateKey(env.CKB_MERCHANT_PRIVATE_KEY, "CKB_MERCHANT_PRIVATE_KEY")
      ),
      buildAccount(
        requirePrivateKey(env.CKB_TEST_BUYER_PRIVATE_KEY, "CKB_TEST_BUYER_PRIVATE_KEY")
      ),
      buildAccount(
        requirePrivateKey(
          env.CKB_SPORE_MINTER_PRIVATE_KEY,
          "CKB_SPORE_MINTER_PRIVATE_KEY"
        )
      ),
    ]).then(([issuer, merchant, buyer, sporeMinter]) => ({
      issuer,
      merchant,
      buyer,
      sporeMinter,
    }));
  }

  return walletSetPromise;
}

export async function resolveMerchantAddress() {
  if (env.PAYMENT_RECEIVER_ADDRESS) {
    return env.PAYMENT_RECEIVER_ADDRESS;
  }

  const wallets = await getWalletSet();
  return wallets.merchant.address;
}

export async function resolveXudtArgs() {
  if (env.CKB_XUDT_ARGS) {
    return env.CKB_XUDT_ARGS;
  }

  const wallets = await getWalletSet();
  return `${wallets.issuer.lockScript.hash()}00000000`;
}

export async function getActiveTokenConfig() {
  const wallets = await getWalletSet();

  return {
    symbol: env.CKB_TOKEN_SYMBOL,
    decimals: env.CKB_TOKEN_DECIMALS,
    network: env.CKB_NETWORK,
    issuerAddress: wallets.issuer.address,
    receiverAddress: await resolveMerchantAddress(),
    xudtArgs: await resolveXudtArgs(),
  };
}
