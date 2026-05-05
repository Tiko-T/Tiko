import { ccc } from "@ckb-ccc/core";
import { createSpore, type SporeScriptInfoLike } from "@ckb-ccc/spore";

import { env } from "@/lib/env";

import systemScripts from "./system-scripts.json";
import { cccClient } from "./ccc-client";
import { getSporeMinterAccount } from "./wallets";

function getDevnetSporeScriptInfo(): SporeScriptInfoLike {
  const script = systemScripts.devnet.spore.script;

  return {
    codeHash: script.codeHash,
    hashType: script.hashType,
    cellDeps: script.cellDeps,
    cobuild: true,
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function mintTicketSpore(params: {
  ownerAddress: string;
  contentJson: string;
  contentType?: string;
}) {
  const { ownerAddress, contentJson, contentType = "application/json" } = params;
  const sporeMinter = await getSporeMinterAccount();
  const signer = new ccc.SignerCkbPrivateKey(cccClient, sporeMinter.privateKey);
  const ownerLockScript = (await ccc.Address.fromString(ownerAddress, cccClient)).script;
  const scriptInfo = env.CKB_NETWORK === "devnet" ? getDevnetSporeScriptInfo() : undefined;

  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const { tx, id } = await createSpore({
        signer,
        to: ownerLockScript,
        data: {
          contentType,
          content: ccc.bytesFrom(contentJson, "utf8"),
        },
        scriptInfo,
      });

      await tx.completeFeeBy(signer, 2_000n);

      const txHash = await signer.sendTransaction(tx);
      await signer.client.waitTransaction(
        txHash,
        env.PAYMENT_CONFIRMATIONS_REQUIRED,
        120_000,
        2_000
      );

      return {
        txHash,
        outputIndex: 0,
        sporeId: id,
      };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);

      if (!/capacity|cell/i.test(message) || attempt === 5) {
        throw error;
      }

      await sleep(attempt * 2_000);
    }
  }

  throw lastError;
}
