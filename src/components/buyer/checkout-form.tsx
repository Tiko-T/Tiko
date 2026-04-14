"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import type { CatalogProductView } from "@/lib/frontend/contracts";
import { tikoApi } from "@/lib/frontend/api";

export function CheckoutForm(props: { product: CatalogProductView }) {
  const router = useRouter();
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerDisplayName, setBuyerDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const order = await tikoApi.createCheckoutOrder({
        buyerEmail,
        buyerDisplayName: buyerDisplayName || undefined,
        productSlug: props.product.slug,
      });

      startTransition(() => {
        router.push(`/orders/${order.id}`);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create order."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="section-card rounded-[2.25rem] p-6 sm:p-8"
    >
      <div className="mb-6 space-y-3">
        <p className="eyebrow text-[color:var(--accent-strong)]">Buyer details</p>
        <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
          Reserve this ticket before you pay.
        </h2>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
          Enter the email where you want updates for this order. Once the order is
          created, you will continue to the payment instructions.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Email address</span>
          <input
            type="email"
            required
            value={buyerEmail}
            onChange={(event) => setBuyerEmail(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="you@example.com"
          />
          <p className="text-sm text-[color:var(--muted)]">
            Used for the order record and ticket delivery updates.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">
            Display name
          </span>
          <input
            type="text"
            value={buyerDisplayName}
            onChange={(event) => setBuyerDisplayName(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="Optional"
          />
          <p className="text-sm text-[color:var(--muted)]">
            Helpful for operator lookup and guest-facing confirmation screens.
          </p>
        </label>
      </div>

      <div className="mt-6 rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5 text-sm text-[color:var(--muted)]">
        <p className="font-medium text-[color:var(--ink)]">What happens next</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StepHint step="01" body="Tiko creates the order and locks the exact amount." />
          <StepHint
            step="02"
            body="Pay from a supported CKB wallet using the provided receiver address."
          />
          <StepHint
            step="03"
            body="The QR credential and collectible proof unlock after confirmation."
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={props.product.detailsHref}
          className={buttonClasses({
            variant: "ghost",
            size: "sm",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event details
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || props.product.tier?.remaining === 0}
          className={buttonClasses({
            variant: "primary",
            size: "lg",
          })}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Creating order…
            </>
          ) : (
            <>
              Continue to payment setup
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function StepHint(props: { step: string; body: string }) {
  return (
    <div className="rounded-[1.1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-3">
      <p className="eyebrow text-[color:var(--muted)]">{props.step}</p>
      <p className="mt-2 leading-6">{props.body}</p>
    </div>
  );
}
