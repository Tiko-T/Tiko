"use client";
import {
  useCallback,
  startTransition,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  CalendarDays,
  LoaderCircle,
  RefreshCcw,
  Ticket,
  Wallet,
} from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { CopyButton } from "@/components/common/copy-button";
import { QrCodeCard } from "@/components/common/qr-code-card";
import { StatusBadge } from "@/components/common/status-badge";
import { DownloadableTicketCard } from "@/components/buyer/downloadable-ticket-card";
import {
  orderNeedsConfirmation,
  orderNeedsTxHash,
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

  const submitPaymentHash = useCallback(async (hash: string) => {
    try {
      const fresh = await tikoApi.submitPayment(order.id, hash, true);
      startTransition(() => {
        setOrder(fresh);
      });
      setError(null);
      setNotice(
        fresh.stage === "ticket_ready"
          ? "Booking confirmed. Your ticket is ready."
          : "Payment submitted. We're checking the chain now."
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't confirm that booking yet."
      );

      try {
        const fresh = await tikoApi.getOrder(order.id);
        startTransition(() => {
          setOrder(fresh);
        });

        if (fresh.stage === "confirming_payment") {
          setNotice("Payment is still being confirmed. Refresh in a moment.");
        }
      } catch {}
    }
  }, [order.id]);

  useEffect(() => {
    if (!orderNeedsConfirmation(order) || !order.payment.submittedTxHash) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startRefresh(() => {
        void refreshOrder()
          .then((fresh) => {
            if (fresh.stage === "ticket_ready") {
              setNotice("Booking confirmed. Your ticket is ready.");
            } else if (fresh.stage === "confirming_payment") {
              setNotice("Payment seen. Waiting for final confirmation.");
            }
          })
          .catch(() => {});
      });
    }, 7_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [order, refreshOrder, startRefresh]);

  async function handleSubmitTxHash(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextHash = (order.payment.submittedTxHash ?? txHash).trim();

    if (!nextHash) {
      setError("Paste the payment transaction hash before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await submitPaymentHash(nextHash);
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
      title: "Booking created",
      body: order.pricing.isFree
        ? "Your booking is confirmed."
        : "Your booking is in progress.",
      complete: true,
      active: order.stage === "awaiting_payment",
    },
    {
      key: "payment",
      step: "02",
      title: order.pricing.isFree ? "Ticket issued" : "Payment received",
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
          ? "Your ticket is ready to open."
          : "We'll unlock your ticket once the booking is confirmed.",
      complete: order.stage === "ticket_ready",
      active: order.stage === "ticket_ready",
    },
  ];

  const pageTitle =
    order.stage === "ticket_ready"
      ? "Your ticket is ready."
      : order.stage === "failed"
      ? "There is a problem with this booking."
      : order.pricing.isFree
      ? "Complete your booking."
      : "Finish your booking.";

  const pageBody =
    order.stage === "ticket_ready"
      ? "Keep this page handy on the day. Your ticket and entry QR code are here."
      : order.stage === "failed"
      ? "We couldn't finish this booking yet. Check the payment details below or refresh to try again."
      : order.pricing.isFree
      ? "Finish the booking details below and your ticket will be ready right away."
      : "Complete the booking details below and we’ll issue the ticket once everything is confirmed.";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_22rem]">
      <section className="space-y-6">
        <div className="section-card rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <StatusBadge label={order.statusLabel} tone={toneForStage(order.stage)} />
              <div className="space-y-2">
                <p className="eyebrow text-[color:var(--muted)]">Booking {order.reference}</p>
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
              Refresh
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
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <QrCodeCard
                value={order.ticket.qrPayload}
                title="Your ticket QR"
                caption="Show this at the entrance."
              />

              <div className="ticket-stub section-card space-y-5 rounded-[2.2rem] p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[color:rgba(47,111,80,0.12)] text-[color:var(--success)]">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="eyebrow text-[color:var(--utility)]">Ticket ready</p>
                      <p className="text-sm text-[color:var(--muted)]">
                        Keep this screen ready at entry.
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
                  <InfoCard label="Ticket code" value={order.ticket.accessCode} />
                  <InfoCard
                    label="Ticket holder"
                    value={order.buyer.displayName ?? order.buyer.email}
                    hint={order.buyer.displayName ? order.buyer.email : "Order contact"}
                  />
                  <InfoCard
                    label="Entry status"
                    value={order.ticket.statusLabel}
                    hint={
                      order.ticket.checkedInAtLabel
                        ? `Checked in ${order.ticket.checkedInAtLabel}`
                        : "Ready to use"
                    }
                  />
                  <InfoCard
                    label="Booking reference"
                    value={order.reference}
                    hint="Use this if you need help with this booking."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <CopyButton value={order.ticket.accessCode} label="Copy ticket code" />
                  <CopyButton value={order.reference} label="Copy booking reference" />
                </div>
              </div>
            </div>

            <DownloadableTicketCard order={order} />
          </div>
        ) : (
          <div className="section-card rounded-[2.2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[color:rgba(211,71,57,0.12)] text-[color:var(--accent-strong)]">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  Finish booking
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  Use the details below to finish the booking and receive the ticket.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <InfoCard
                label="Amount"
                value={order.pricing.paymentDisplay}
                hint="Send this exact amount."
              />
              <InfoCard
                label="Pay to"
                value={order.receiverAddressShort}
                hint="Use this booking address."
              />
              <InfoCard
                label="Pay before"
                value={order.payment.expiresAtLabel}
                hint="Complete booking before this time."
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5 text-sm text-[color:var(--muted)]">
                <p className="eyebrow text-[color:var(--muted)]">Next</p>
                <div className="mt-4 space-y-3 leading-7">
                  <p>1. Send {order.pricing.paymentDisplay}.</p>
                  <p>2. Paste the payment transaction hash from your wallet.</p>
                  <p>3. We’ll confirm the booking and unlock your ticket.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitTxHash} className="space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Payment transaction hash
                  </span>
                  <textarea
                    rows={4}
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    placeholder="Paste the transaction hash from your wallet"
                    className="w-full rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
                  />
                  <p className="text-sm text-[color:var(--muted)]">
                    This lets us match the onchain payment to this order.
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
                        Checking booking…
                      </>
                    ) : orderNeedsTxHash(order) ? (
                      "Submit tx hash"
                    ) : (
                      "Retry confirmation"
                    )}
                  </button>

                  {order.payment.submittedTxHash ? (
                    <CopyButton
                      value={order.payment.submittedTxHash}
                      label="Copy tx hash"
                    />
                  ) : null}
                  <CopyButton value={order.receiverAddress} label="Copy payment address" />
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
          title="Booking"
          lines={[
            order.buyer.displayName ?? "Ticket holder",
            order.buyer.email,
            `${order.quantity} × ${order.tierName ?? order.product.title}`,
            `Booking ${order.reference}`,
          ]}
        />
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
        {props.lines.map((line, index) => (
          <p key={`${props.title}-${index}`}>{line}</p>
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
