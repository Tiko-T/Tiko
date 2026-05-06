"use client";

import { useState } from "react";
import { Coins, LoaderCircle } from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { CopyButton } from "@/components/common/copy-button";
import { tikoApi } from "@/lib/frontend/api";
import type { FaucetView } from "@/lib/frontend/contracts";

export function FaucetClaimForm() {
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState<FaucetView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const claimed = await tikoApi.claimFaucet(walletAddress);
      setResult(claimed);
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to process the faucet request."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form onSubmit={handleSubmit} className="section-card rounded-[2.4rem] p-6 sm:p-8">
        <div className="space-y-3">
          <p className="eyebrow text-[color:var(--accent-strong)]">Public faucet</p>
          <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
            Claim test funds for checkout.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            Enter a CKB testnet wallet address to receive a faucet allocation for Tiko
            product testing. Each wallet can claim up to 200 USD worth in total.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--ink)]">Wallet address</span>
            <textarea
              required
              rows={4}
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              className="w-full rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
              placeholder="Paste your ckt1... testnet wallet address"
            />
          </label>

          {error ? (
            <div className="rounded-[1rem] border border-[color:rgba(151,37,45,0.16)] bg-[color:rgba(151,37,45,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-[1.4rem] border border-[color:rgba(53,94,77,0.16)] bg-[color:rgba(53,94,77,0.08)] p-5">
              <p className="text-sm font-semibold text-[color:var(--ink)]">Claim processed</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FaucetStat label="Claim amount" value={result.claimAmountDisplay} />
                <FaucetStat label="Remaining for wallet" value={result.remainingAmountDisplay} />
                <FaucetStat label="Wallet cap" value={result.maxPerWalletDisplay} />
                <FaucetStat
                  label="Transaction hash"
                  value={result.txHash ?? "Pending"}
                  breakAll
                />
              </div>
              {result.txHash ? (
                <div className="mt-4">
                  <CopyButton value={result.txHash} label="Copy tx hash" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonClasses({
              variant: "primary",
              size: "lg",
            })}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Sending funds…
              </>
            ) : (
              <>
                <Coins className="h-5 w-5" />
                Claim faucet
              </>
            )}
          </button>
        </div>
      </form>

      <aside className="space-y-5" />
    </div>
  );
}

function FaucetStat(props: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p
        className={`mt-3 text-sm font-semibold text-[color:var(--ink)] ${
          props.breakAll ? "break-all" : ""
        }`}
      >
        {props.value}
      </p>
    </div>
  );
}
