import { ccc, CellDepInfoLike, KnownScript, Script } from "@ckb-ccc/core";

import { env, type ChainNetworkName } from "@/lib/env";

import systemScripts from "./system-scripts.json";

export type Network = ChainNetworkName;

export type ScriptInfo = Pick<Script, "codeHash" | "hashType"> & {
  cellDeps: CellDepInfoLike[];
};

export const DEVNET_SCRIPTS: Record<string, ScriptInfo> = {
  [KnownScript.Secp256k1Blake160]:
    systemScripts.devnet.secp256k1_blake160_sighash_all.script as ScriptInfo,
  [KnownScript.Secp256k1Multisig]:
    systemScripts.devnet.secp256k1_blake160_multisig_all.script as ScriptInfo,
  [KnownScript.AnyoneCanPay]:
    systemScripts.devnet.anyone_can_pay.script as ScriptInfo,
  [KnownScript.OmniLock]: systemScripts.devnet.omnilock.script as ScriptInfo,
  [KnownScript.XUdt]: systemScripts.devnet.xudt.script as ScriptInfo,
  [KnownScript.NervosDao]: systemScripts.devnet.dao.script as ScriptInfo,
};

export function buildCccClient(network: Network) {
  if (network === "mainnet") {
    return env.CKB_RPC_URL
      ? new ccc.ClientPublicMainnet({ url: env.CKB_RPC_URL })
      : new ccc.ClientPublicMainnet();
  }

  if (network === "testnet") {
    return env.CKB_RPC_URL
      ? new ccc.ClientPublicTestnet({ url: env.CKB_RPC_URL })
      : new ccc.ClientPublicTestnet();
  }

  return new ccc.ClientPublicTestnet({
    url: env.CKB_RPC_URL ?? "http://localhost:28114",
    scripts: DEVNET_SCRIPTS as never,
  });
}

export function readEnvNetwork(): Network {
  return env.CKB_NETWORK;
}

export const cccClient = buildCccClient(readEnvNetwork());
