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

async function getIssuerAccount() {
  const privateKey = requirePrivateKey(
    env.CKB_ISSUER_PRIVATE_KEY,
    "CKB_ISSUER_PRIVATE_KEY"
  );

  return buildAccount(privateKey);
}

async function getMerchantAccount() {
  const privateKey = requirePrivateKey(
    env.CKB_MERCHANT_PRIVATE_KEY,
    "CKB_MERCHANT_PRIVATE_KEY"
  );

  return buildAccount(privateKey);
}

async function getBuyerTestAccount() {
  const privateKey = requirePrivateKey(
    env.CKB_TEST_BUYER_PRIVATE_KEY,
    "CKB_TEST_BUYER_PRIVATE_KEY"
  );

  return buildAccount(privateKey);
}

export async function getSporeMinterAccount() {
  const privateKey = requirePrivateKey(
    env.CKB_SPORE_MINTER_PRIVATE_KEY,
    "CKB_SPORE_MINTER_PRIVATE_KEY"
  );

  return buildAccount(privateKey);
}

export async function getWalletSet(): Promise<WalletSet> {
  if (!walletSetPromise) {
    walletSetPromise = Promise.all([
      getIssuerAccount(),
      getMerchantAccount(),
      getBuyerTestAccount(),
      getSporeMinterAccount(),
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

  return (await getMerchantAccount()).address;
}

export async function resolveXudtArgs() {
  if (env.CKB_XUDT_ARGS) {
    return env.CKB_XUDT_ARGS;
  }

  return `${(await getIssuerAccount()).lockScript.hash()}00000000`;
}

export async function getActiveTokenConfig() {
  const issuerAddress = env.CKB_ISSUER_ADDRESS ?? (await getIssuerAccount()).address;

  return {
    symbol: env.CKB_TOKEN_SYMBOL,
    decimals: env.CKB_TOKEN_DECIMALS,
    network: env.CKB_NETWORK,
    issuerAddress,
    receiverAddress: await resolveMerchantAddress(),
    xudtArgs: await resolveXudtArgs(),
  };
}
