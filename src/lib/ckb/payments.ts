import { ccc } from "@ckb-ccc/core";

import { env } from "@/lib/env";

import { cccClient } from "./ccc-client";
import { getWalletSet, resolveXudtArgs } from "./wallets";

export type VerifiedPayment = {
  txHash: string;
  payerAddress?: string;
  matchedAmount: bigint;
  receiverAddress: string;
  outputIndex: number;
};

export async function getCapacityBalance(address: string) {
  const addr = await ccc.Address.fromString(address, cccClient);
  return cccClient.getBalance([addr.script]);
}

export async function transferCapacityToAddress(
  senderPrivateKey: string,
  receiverAddress: string,
  amountInCkb: string
) {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, senderPrivateKey);
  const { script: receiverLockScript } = await ccc.Address.fromString(
    receiverAddress,
    cccClient
  );

  const tx = ccc.Transaction.from({
    outputs: [{ lock: receiverLockScript }],
    outputsData: [],
  });

  tx.outputs.forEach((output) => {
    output.capacity = ccc.fixedPointFrom(amountInCkb);
  });

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  const txHash = await signer.sendTransaction(tx);

  return { txHash };
}

export async function getXudtTypeScript(xudtArgs?: string) {
  return ccc.Script.fromKnownScript(
    cccClient,
    ccc.KnownScript.XUdt,
    xudtArgs ?? (await resolveXudtArgs())
  );
}

export async function getTokenBalance(address: string, xudtArgs?: string) {
  const lockScript = (await ccc.Address.fromString(address, cccClient)).script;
  const xUdtType = await getXudtTypeScript(xudtArgs);
  let balance = 0n;

  for await (const cell of cccClient.findCellsByLock(lockScript, xUdtType, true)) {
    balance += ccc.numFromBytes(cell.outputData);
  }

  return balance;
}

export async function issueTokensToAddress(
  amount: bigint,
  receiverAddress: string,
  xudtArgs?: string
) {
  const wallets = await getWalletSet();
  const receiverLockScript = (await ccc.Address.fromString(receiverAddress, cccClient)).script;
  const xUdtType = await getXudtTypeScript(xudtArgs);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: receiverLockScript, type: xUdtType }],
    outputsData: [ccc.numLeToBytes(amount, 16)],
  });

  await tx.addCellDepsOfKnownScripts(wallets.issuer.signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(wallets.issuer.signer);
  await tx.completeFeeBy(wallets.issuer.signer, 1000);

  const txHash = await wallets.issuer.signer.sendTransaction(tx);
  return { txHash };
}

export async function transferTokensToAddress(
  senderPrivateKey: string,
  receiverAddress: string,
  amount: bigint,
  xudtArgs?: string
) {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, senderPrivateKey);
  const senderLockScript = (await signer.getAddressObjSecp256k1()).script;
  const receiverLockScript = (await ccc.Address.fromString(receiverAddress, cccClient)).script;
  const xUdtType = await getXudtTypeScript(xudtArgs);

  const tx = ccc.Transaction.from({
    outputs: [{ lock: receiverLockScript, type: xUdtType }],
    outputsData: [ccc.numLeToBytes(amount, 16)],
  });

  await tx.completeInputsByUdt(signer, xUdtType);

  const inputBalance =
    (await tx.getInputsUdtBalance(signer.client, xUdtType)) -
    tx.getOutputsUdtBalance(xUdtType);

  if (inputBalance > ccc.Zero) {
    tx.addOutput(
      {
        lock: senderLockScript,
        type: xUdtType,
      },
      ccc.numLeToBytes(inputBalance, 16)
    );
  }

  await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  const txHash = await signer.sendTransaction(tx);
  return { txHash };
}

export async function submitBuyerTestPayment(
  receiverAddress: string,
  amount: bigint,
  xudtArgs?: string
) {
  const wallets = await getWalletSet();
  return transferTokensToAddress(wallets.buyer.privateKey, receiverAddress, amount, xudtArgs);
}

export async function waitForTransaction(txHash: string, confirmations = env.PAYMENT_CONFIRMATIONS_REQUIRED) {
  const tx = await cccClient.waitTransaction(txHash, confirmations, 120_000, 2_000);

  if (!tx) {
    throw new Error(`Transaction ${txHash} was not found before timeout`);
  }

  if (tx.status !== "committed") {
    throw new Error(`Transaction ${txHash} is ${tx.status}`);
  }

  return tx;
}

async function derivePayerAddress(txHash: string) {
  const tx = await cccClient.getTransaction(txHash);
  const input = tx?.transaction.inputs[0];

  if (!input) {
    return undefined;
  }

  const previousCell = await cccClient.getCell(input.previousOutput);

  if (!previousCell) {
    return undefined;
  }

  return ccc.Address.fromScript(previousCell.cellOutput.lock, cccClient).toString();
}

export async function verifySubmittedPayment(params: {
  txHash: string;
  receiverAddress: string;
  expectedAmount: bigint;
  xudtArgs: string;
  confirmationsRequired?: number;
}) {
  const { txHash, receiverAddress, expectedAmount, xudtArgs, confirmationsRequired } =
    params;
  const tx = await waitForTransaction(txHash, confirmationsRequired);
  const receiverLockScript = (await ccc.Address.fromString(receiverAddress, cccClient)).script;
  const xUdtType = await getXudtTypeScript(xudtArgs);

  for (const [index, output] of tx.transaction.outputs.entries()) {
    if (!output.type?.eq(xUdtType) || !output.lock.eq(receiverLockScript)) {
      continue;
    }

    const matchedAmount = ccc.numFromBytes(tx.transaction.outputsData[index] ?? "0x");

    if (matchedAmount < expectedAmount) {
      continue;
    }

    return {
      txHash,
      receiverAddress,
      matchedAmount,
      outputIndex: index,
      payerAddress: await derivePayerAddress(txHash),
    } satisfies VerifiedPayment;
  }

  throw new Error(
    `Transaction ${txHash} does not contain the expected xUDT payment to ${receiverAddress}`
  );
}
