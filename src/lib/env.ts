import { z } from "zod";

const hexPrivateKey = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const chainNetworkSchema = z.enum(["devnet", "testnet", "mainnet"]);

export const DEVNET_DEFAULT_KEYS = {
  issuer: "0x1111111111111111111111111111111111111111111111111111111111111111",
  merchant: "0x2222222222222222222222222222222222222222222222222222222222222222",
  buyer: "0x3333333333333333333333333333333333333333333333333333333333333333",
  sporeMinter:
    "0x4444444444444444444444444444444444444444444444444444444444444444",
} as const;

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@127.0.0.1:5432/tiko?schema=public"),
  APP_URL: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z
    .string()
    .min(16)
    .default("dev-session-secret-for-local-testing"),
  AUTH_SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
  BETA_INVITE_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(72),
  CRON_SECRET: z.string().min(16).optional(),
  BETA_ADMIN_EMAIL: z.string().email().optional(),
  BETA_ADMIN_PASSWORD: z.string().min(12).optional(),
  BETA_ADMIN_NAME: z.string().min(1).optional(),
  PAYMENT_PROVIDER_MODE: z.enum(["mock", "ckb"]).default("ckb"),
  PAYMENT_CONFIRMATIONS_REQUIRED: z.coerce.number().int().min(1).default(1),
  CKB_NETWORK: chainNetworkSchema.default("devnet"),
  CKB_RPC_URL: z.string().optional(),
  CKB_TOKEN_SYMBOL: z.string().default("tTIKO"),
  CKB_TOKEN_DECIMALS: z.coerce.number().int().min(0).max(18).default(2),
  PRICE_DISPLAY_SYMBOL: z.string().default("USD"),
  CKB_ISSUER_ADDRESS: z.string().optional(),
  CKB_ISSUER_PRIVATE_KEY: hexPrivateKey.optional(),
  CKB_MERCHANT_PRIVATE_KEY: hexPrivateKey.optional(),
  CKB_TEST_BUYER_PRIVATE_KEY: hexPrivateKey.optional(),
  CKB_SPORE_MINTER_PRIVATE_KEY: hexPrivateKey.optional(),
  PAYMENT_RECEIVER_ADDRESS: z.string().optional(),
  CKB_XUDT_ARGS: z
    .string()
    .regex(/^0x[0-9a-fA-F]+$/)
    .optional()
    .or(z.literal("")),
  SPORE_MINTING_MODE: z.enum(["simulated", "real"]).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

const rawEnv = rawEnvSchema.parse(process.env);
const useDevnetDefaults = rawEnv.CKB_NETWORK === "devnet";
const isHostedMode =
  rawEnv.NODE_ENV === "production" || rawEnv.CKB_NETWORK !== "devnet";

function resolvePrivateKey(
  value: string | undefined,
  fallback: (typeof DEVNET_DEFAULT_KEYS)[keyof typeof DEVNET_DEFAULT_KEYS]
) {
  if (value) {
    return value;
  }

  if (useDevnetDefaults) {
    return fallback;
  }

  return undefined;
}

export const env = {
  ...rawEnv,
  CKB_ISSUER_PRIVATE_KEY: resolvePrivateKey(
    rawEnv.CKB_ISSUER_PRIVATE_KEY,
    DEVNET_DEFAULT_KEYS.issuer
  ),
  CKB_MERCHANT_PRIVATE_KEY: resolvePrivateKey(
    rawEnv.CKB_MERCHANT_PRIVATE_KEY,
    DEVNET_DEFAULT_KEYS.merchant
  ),
  CKB_TEST_BUYER_PRIVATE_KEY: resolvePrivateKey(
    rawEnv.CKB_TEST_BUYER_PRIVATE_KEY,
    DEVNET_DEFAULT_KEYS.buyer
  ),
  CKB_SPORE_MINTER_PRIVATE_KEY: resolvePrivateKey(
    rawEnv.CKB_SPORE_MINTER_PRIVATE_KEY,
    DEVNET_DEFAULT_KEYS.sporeMinter
  ),
  SPORE_MINTING_MODE:
    rawEnv.SPORE_MINTING_MODE ?? (useDevnetDefaults ? "real" : "simulated"),
  CKB_RPC_URL:
    rawEnv.CKB_RPC_URL ?? (useDevnetDefaults ? "http://localhost:28114" : undefined),
  CKB_XUDT_ARGS: rawEnv.CKB_XUDT_ARGS || undefined,
};

if (
  env.NODE_ENV === "production" &&
  env.SESSION_SECRET === "dev-session-secret-for-local-testing"
) {
  throw new Error("SESSION_SECRET must be set for production deployments");
}

if (isHostedMode && !env.CRON_SECRET) {
  throw new Error("CRON_SECRET must be set for hosted beta deployments");
}

if (isHostedMode && !env.CKB_RPC_URL) {
  throw new Error("CKB_RPC_URL must be set for hosted beta deployments");
}

if (isHostedMode && !env.CKB_XUDT_ARGS) {
  throw new Error("CKB_XUDT_ARGS must be set for hosted beta deployments");
}

if (isHostedMode && !env.PAYMENT_RECEIVER_ADDRESS) {
  throw new Error("PAYMENT_RECEIVER_ADDRESS must be set for hosted beta deployments");
}

if (isHostedMode && !env.CKB_ISSUER_ADDRESS && !env.CKB_ISSUER_PRIVATE_KEY) {
  throw new Error(
    "CKB_ISSUER_ADDRESS or CKB_ISSUER_PRIVATE_KEY must be set for hosted beta deployments"
  );
}

if (env.SPORE_MINTING_MODE === "real" && !useDevnetDefaults && !env.CKB_SPORE_MINTER_PRIVATE_KEY) {
  throw new Error("CKB_SPORE_MINTER_PRIVATE_KEY must be set when SPORE_MINTING_MODE=real");
}

export type AppEnv = typeof env;
export type ChainNetworkName = z.infer<typeof chainNetworkSchema>;

export function toPrismaNetwork(network: ChainNetworkName) {
  switch (network) {
    case "devnet":
      return "DEVNET" as const;
    case "testnet":
      return "TESTNET" as const;
    case "mainnet":
      return "MAINNET" as const;
  }
}
