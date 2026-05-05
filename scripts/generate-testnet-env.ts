import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";

import { ccc } from "@ckb-ccc/core";

type GeneratedWallet = {
  name: "issuer" | "merchant" | "buyer" | "sporeMinter";
  privateKey: string;
  address: string;
  lockHash: string;
};

const ENV_PATH = path.join(process.cwd(), ".env");

function randomHexPrivateKey() {
  return `0x${randomBytes(32).toString("hex")}`;
}

function randomSecret() {
  return randomBytes(24).toString("base64url");
}

async function ensureEnvDoesNotExist() {
  try {
    await access(ENV_PATH);
    throw new Error(
      `${ENV_PATH} already exists. Move it away or delete it before generating a fresh testnet env.`
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function buildWallet(
  client: ccc.ClientPublicTestnet,
  name: GeneratedWallet["name"]
): Promise<GeneratedWallet> {
  const privateKey = randomHexPrivateKey();
  const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
  const addressObj = await signer.getAddressObjSecp256k1();

  return {
    name,
    privateKey,
    address: addressObj.toString(),
    lockHash: addressObj.script.hash(),
  };
}

async function main() {
  await ensureEnvDoesNotExist();

  const client = new ccc.ClientPublicTestnet();
  const [issuer, merchant, buyer, sporeMinter] = await Promise.all([
    buildWallet(client, "issuer"),
    buildWallet(client, "merchant"),
    buildWallet(client, "buyer"),
    buildWallet(client, "sporeMinter"),
  ]);

  const sessionSecret = randomSecret();
  const cronSecret = randomSecret();
  const adminPassword = randomSecret();
  const xudtArgs = `${issuer.lockHash}00000000`;

  const envText = [
    "APP_URL=http://127.0.0.1:3001",
    "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tiko?schema=public",
    `SESSION_SECRET=${sessionSecret}`,
    "AUTH_SESSION_TTL_DAYS=14",
    "BETA_INVITE_TTL_HOURS=72",
    `CRON_SECRET=${cronSecret}`,
    "BETA_ADMIN_EMAIL=admin@tiko.local",
    `BETA_ADMIN_PASSWORD=${adminPassword}`,
    "BETA_ADMIN_NAME=Tiko Admin",
    "PAYMENT_PROVIDER_MODE=ckb",
    "PAYMENT_CONFIRMATIONS_REQUIRED=1",
    "CKB_NETWORK=testnet",
    "CKB_RPC_URL=https://testnet.ckb.dev/rpc",
    "CKB_TOKEN_SYMBOL=tTIKO",
    "CKB_TOKEN_DECIMALS=2",
    `CKB_ISSUER_ADDRESS=${issuer.address}`,
    `CKB_ISSUER_PRIVATE_KEY=${issuer.privateKey}`,
    `CKB_MERCHANT_PRIVATE_KEY=${merchant.privateKey}`,
    `CKB_TEST_BUYER_PRIVATE_KEY=${buyer.privateKey}`,
    `CKB_SPORE_MINTER_PRIVATE_KEY=${sporeMinter.privateKey}`,
    `PAYMENT_RECEIVER_ADDRESS=${merchant.address}`,
    `CKB_XUDT_ARGS=${xudtArgs}`,
    "SPORE_MINTING_MODE=real",
    "BLOB_READ_WRITE_TOKEN=",
    "",
  ].join("\n");

  await writeFile(ENV_PATH, envText, "utf8");

  console.log(
    JSON.stringify(
      {
        envPath: ENV_PATH,
        admin: {
          email: "admin@tiko.local",
          password: adminPassword,
        },
        token: {
          symbol: "tTIKO",
          decimals: 2,
          xudtArgs,
        },
        wallets: {
          issuer: {
            address: issuer.address,
            fundThisFirst: true,
            recommendedFunding: "1000 CKB testnet",
          },
          merchant: {
            address: merchant.address,
            fundThisFirst: false,
            note: "Configured as the payment receiver address",
          },
          buyer: {
            address: buyer.address,
            fundThisFirst: false,
            note: "Will be funded and receive test tokens by the bootstrap script",
          },
          sporeMinter: {
            address: sporeMinter.address,
            fundThisFirst: false,
            note: "Will be funded by the bootstrap script before real Spore minting",
          },
        },
        nextStep:
          "Fund the issuer wallet on CKB testnet, then run npm run testnet:bootstrap",
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
