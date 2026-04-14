"use client";

import Link from "next/link";
import {
  useCallback,
  startTransition,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { CopyButton } from "@/components/common/copy-button";
import { QrCodeCard } from "@/components/common/qr-code-card";
import { StatusBadge } from "@/components/common/status-badge";
import {
  orderNeedsConfirmation,
  orderNeedsTxHash,
  orderReadyForEntry,
  type OrderView,
} from "@/lib/frontend/contracts";
import { tikoApi } from "@/lib/frontend/api";

function toneForStage(stage: OrderView["stage"]) {
  if (stage === "ticket_ready") {
    return "success" as const;
  }

  if (stage === "failed") {
    return "danger" as const;
  }

  if (stage === "confirming_payment") {
    return "warning" as const;
  }

  return "accent" as const;
}

export function OrderExperience(props: { initialOrder: OrderView }) {
  const [order, setOrder] = useState(props.initialOrder);
  const [txHash, setTxHash] = useState(props.initialOrder.payment.submittedTxHash ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const refreshOrder = useCallback(async () => {
    const fresh = await tikoApi.getOrder(order.id);
    startTransition(() => {
      setOrder(fresh);
    });
    return fresh;
  }, [order.id]);

  const reconcileOrder = useCallback(async (hash: string) => {
    try {
      const fresh = await tikoApi.submitPayment(order.id, hash, true);
      startTransition(() => {
        setOrder(fresh);
      });
      setError(null);
      setNotice(
        fresh.stage === "ticket_ready"
          ? "Payment confirmed. Your pass and collectible are ready."
          : "Transaction submitted. Tiko is checking the chain state."
      );
    } catch (reconcileError) {
      setError(
        reconcileError instanceof Error
          ? reconcileError.message
          : "Unable to verify the transaction yet."
      );

      try {
        const fresh = await tikoApi.getOrder(order.id);
        startTransition(() => {
          setOrder(fresh);
        });

        if (fresh.stage === "confirming_payment") {
          setNotice("Payment is still confirming. Tiko will keep rechecking.");
        }
      } catch {}
    }
  }, [order.id]);

  useEffect(() => {
    if (!orderNeedsConfirmation(order) || !order.payment.submittedTxHash) {
      return;
    }

    const submittedHash = order.payment.submittedTxHash;
    const intervalId = window.setInterval(() => {
      startRefresh(() => {
        void reconcileOrder(submittedHash);
      });
    }, 7_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [order, reconcileOrder, startRefresh]);

  async function handleSubmitTxHash(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextHash = (order.payment.submittedTxHash ?? txHash).trim();

    if (!nextHash) {
      setError("Paste a transaction hash before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await reconcileOrder(nextHash);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setNotice(null);
    setError(null);
    await refreshOrder();
  }

  const steps = [
    {
      key: "created",
      step: "01",
      title: "Order created",
      body: "Buyer details locked and the amount is ready.",
      complete: true,
      active: order.stage === "awaiting_payment",
    },
    {
      key: "payment",
      step: "02",
      title: "Payment submitted",
      body: order.payment.statusLabel,
      complete: !orderNeedsTxHash(order),
      active: order.stage === "confirming_payment",
    },
    {
      key: "ticket",
      step: "03",
      title: "Ticket ready",
      body:
        order.stage === "ticket_ready"
          ? "The venue QR credential is live."
          : "Waiting on confirmation before entry unlocks.",
      complete: order.stage === "ticket_ready",
      active: order.stage === "ticket_ready",
    },
  ];

  const pageTitle =
    order.stage === "ticket_ready"
      ? "Your ticket is ready."
      : order.stage === "failed"
      ? "This order needs attention."
      : "Finish the payment step.";

  const pageBody =
    order.stage === "ticket_ready"
      ? "Keep this page available at the venue. Tiko validates the live ticket state here, then lets the collectible proof sit in the background."
      : order.stage === "failed"
      ? "The order did not reach a usable ticket state yet. Recheck the payment details below or refresh to pull the latest backend state."
      : "Tiko already created the order. What remains is the exact CKB payment and a valid transaction hash.";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_22rem]">
      <section className="space-y-6">
        <div className="section-card rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <StatusBadge label={order.statusLabel} tone={toneForStage(order.stage)} />
              <div className="space-y-2">
                <p className="eyebrow text-[color:var(--muted)]">Order {order.reference}</p>
                <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                  {pageTitle}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
                  {pageBody}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className={buttonClasses({
                variant: "secondary",
                size: "sm",
              })}
            >
              {isRefreshing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh order
            </button>
          </div>

          {notice ? (
            <div className="mt-5 rounded-[1.2rem] border border-[color:rgba(53,94,77,0.16)] bg-[color:rgba(53,94,77,0.08)] px-4 py-3 text-sm text-[color:var(--utility)]">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-[1.2rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <OrderStep
                key={step.key}
                step={step.step}
                title={step.title}
                body={step.body}
                complete={step.complete}
                active={step.active}
              />
            ))}
          </div>
        </div>

        {order.stage === "ticket_ready" && order.ticket ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <QrCodeCard
              value={order.ticket.qrPayload}
              title="Venue QR"
              caption="Open this at entry. Tiko validates the app-side ticket state, not just chain ownership."
            />

            <div className="ticket-stub section-card space-y-5 rounded-[2.2rem] p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[color:rgba(47,111,80,0.12)] text-[color:var(--success)]">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="eyebrow text-[color:var(--utility)]">Ticket live</p>
                    <p className="text-sm text-[color:var(--muted)]">
                      Keep this screen ready at the door.
                    </p>
                  </div>
                </div>
                <StatusBadge label={order.ticket.statusLabel} tone="success" />
              </div>

              <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5">
                <p className="eyebrow text-[color:var(--muted)]">Event</p>
                <p className="mt-3 font-[family:var(--font-display)] text-4xl text-[color:var(--ink)]">
                  {order.product.title}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {order.event?.windowLabel ?? "Schedule pending"} ·{" "}
                  {order.event?.venue ?? "Venue pending"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Access code" value={order.ticket.accessCode} />
                <InfoCard
                  label="Buyer"
                  value={order.buyer.displayName ?? order.buyer.email}
                  hint={order.buyer.displayName ? order.buyer.email : "Order contact"}
                />
                <InfoCard
                  label="Entry status"
                  value={order.ticket.statusLabel}
                  hint={
                    order.ticket.checkedInAtLabel
                      ? `Updated ${order.ticket.checkedInAtLabel}`
                      : "Ready to scan"
                  }
                />
                <InfoCard
                  label="Collectible"
                  value={order.spore?.mintStatusLabel ?? "Pending"}
                  hint={order.spore?.sporeId ?? "Spore ID will appear after minting"}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <CopyButton value={order.ticket.accessCode} label="Copy access code" />
                <CopyButton value={order.ticket.qrPayload} label="Copy QR payload" />
                {order.payment.confirmedTxHash ? (
                  <CopyButton
                    value={order.payment.confirmedTxHash}
                    label="Copy payment hash"
                  />
                ) : null}
                <Link
                  href="/operator"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <ScanLine className="h-4 w-4" />
                  Open check-in tools
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-card rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[color:rgba(211,71,57,0.12)] text-[color:var(--accent-strong)]">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  Complete the payment step
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  The order already exists. What remains is the exact CKB payment and a
                  valid transaction hash.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <InfoCard
                label="Amount"
                value={order.pricing.paymentDisplay}
                hint="Send the exact token amount"
              />
              <InfoCard
                label="Receiver"
                value={order.receiverAddressShort}
                hint="Merchant settlement address"
              />
              <InfoCard
                label="Payment expires"
                value={order.payment.expiresAtLabel}
                hint="Create a fresh order if this window passes"
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5 text-sm text-[color:var(--muted)]">
                <p className="eyebrow text-[color:var(--muted)]">How to finish</p>
                <div className="mt-4 space-y-3 leading-7">
                  <p>1. Send {order.pricing.paymentDisplay} from a supported CKB wallet.</p>
                  <p>2. Paste the resulting transaction hash into the form.</p>
                  <p>3. Refresh or recheck while Tiko confirms the payment.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitTxHash} className="space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Transaction hash
                  </span>
                  <textarea
                    rows={4}
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    placeholder="Paste the CKB transaction hash after sending payment"
                    className="w-full rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
                  />
                  <p className="text-sm text-[color:var(--muted)]">
                    Tiko uses this hash to reconcile the order with the onchain payment.
                  </p>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={buttonClasses({
                      variant: "primary",
                      size: "md",
                    })}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Sending to Tiko…
                      </>
                    ) : orderNeedsTxHash(order) ? (
                      "Submit payment hash"
                    ) : (
                      "Recheck payment"
                    )}
                  </button>

                  {order.payment.submittedTxHash ? (
                    <CopyButton value={order.payment.submittedTxHash} label="Copy tx hash" />
                  ) : null}
                  <CopyButton value={order.receiverAddress} label="Copy receiver address" />
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-5">
        <SidePanel
          icon={<CalendarDays className="h-5 w-5" />}
          title="Event"
          lines={[
            order.event?.title ?? "Tiko event",
            order.event?.windowLabel ?? "Schedule pending",
            order.event?.venue ?? "Venue pending",
          ]}
        />
        <SidePanel
          icon={<Ticket className="h-5 w-5" />}
          title="Buyer"
          lines={[
            order.buyer.displayName ?? order.buyer.email,
            order.buyer.displayName ? order.buyer.email : "Order contact",
            `${order.quantity} × ${order.tierName ?? order.product.title}`,
          ]}
        />
        <SidePanel
          icon={<Clock3 className="h-5 w-5" />}
          title="Payment state"
          lines={[
            order.payment.statusLabel,
            order.payment.confirmedTxHashShort ??
              order.payment.submittedTxHashShort ??
              "No hash submitted yet",
            order.payment.expiresAtLabel,
          ]}
        />
        <SidePanel
          icon={<Sparkles className="h-5 w-5" />}
          title="Ownership"
          lines={[
            order.spore?.mintStatusLabel ?? "Collectible will mint after confirmation",
            order.spore?.sporeId ?? "Spore ID pending",
            order.spore?.mintTxHashShort ?? "Mint transaction pending",
          ]}
        />
        <SidePanel
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Venue rule"
          lines={[
            "Chain ownership is not the same as venue access.",
            "Tiko still controls check-in, voids, and support actions.",
          ]}
        />
        {orderReadyForEntry(order) ? (
          <Link
            href="/operator"
            className={buttonClasses({
              variant: "secondary",
              size: "md",
              block: true,
            })}
          >
            <ScanLine className="h-4 w-4" />
            Open check-in tools
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

function OrderStep(props: {
  step: string;
  title: string;
  body: string;
  complete: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-4 ${
        props.active
          ? "border-[color:rgba(169,43,31,0.18)] bg-[color:rgba(207,79,64,0.1)]"
          : props.complete
          ? "border-[color:rgba(53,94,77,0.18)] bg-[color:rgba(53,94,77,0.07)]"
          : "border-[color:var(--line)] bg-[color:var(--panel-soft)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
        <span className="eyebrow text-[color:var(--muted)]">{props.step}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}

function SidePanel(props: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="section-card rounded-[1.8rem] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[color:rgba(211,71,57,0.12)] text-[color:var(--accent-strong)]">
          {props.icon}
        </div>
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
      </div>
      <div className="space-y-2 text-sm leading-7 text-[color:var(--muted)]">
        {props.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function InfoCard(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p className="mt-3 break-all text-sm font-semibold text-[color:var(--ink)]">
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{props.hint}</p>
      ) : null}
    </div>
  );
}
