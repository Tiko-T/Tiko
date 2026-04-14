import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { CheckoutForm } from "@/components/buyer/checkout-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCatalogProductBySlug } from "@/lib/frontend/server-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href={product.detailsHref}
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event details
        </Link>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_25rem]">
          <div className="space-y-6">
            <section className="section-card rounded-[2.5rem] px-6 py-8 sm:px-8">
              <div className="space-y-3">
                <p className="eyebrow text-[color:var(--accent-strong)]">Checkout</p>
                <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                  Enter your details, then pay for the ticket.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                  Start with the contact details for this order. You will see the payment
                  instructions next, followed by your live ticket after confirmation.
                </p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <CheckoutStage
                  step="01"
                  title="Your details"
                  body="Enter the name and email that should be tied to this order."
                  active
                />
                <CheckoutStage
                  step="02"
                  title="Wallet payment"
                  body="Pay the exact amount from a supported CKB wallet."
                />
                <CheckoutStage
                  step="03"
                  title="Ticket unlock"
                  body="The QR credential goes live after chain confirmation."
                />
              </div>
            </section>

            <CheckoutForm product={product} />
          </div>

          <aside className="section-card space-y-5 rounded-[2.25rem] p-6 sm:p-8 xl:sticky xl:top-28 xl:h-fit">
            <div>
              <p className="eyebrow text-[color:var(--muted)]">Order summary</p>
              <h2 className="mt-3 font-[family:var(--font-display)] text-4xl text-[color:var(--ink)]">
                {product.title}
              </h2>
            </div>

            <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5">
              <p className="eyebrow text-[color:var(--muted)]">Final amount</p>
              <p className="mt-3 font-[family:var(--font-display)] text-5xl text-[color:var(--ink)]">
                {product.priceDisplay}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {product.tier?.name ?? "Featured pass"} · {product.tier?.availabilityLabel}
              </p>
            </div>

            <div className="grid gap-4">
              <AsideNote
                icon={<CalendarDays className="h-4 w-4" />}
                title="Event timing"
                body={product.event?.windowLabel ?? "Schedule pending"}
              />
              <AsideNote
                icon={<Ticket className="h-4 w-4" />}
                title="No surprise fees"
                body="The amount shown here is the amount you will be asked to pay."
              />
              <AsideNote
                icon={<Wallet className="h-4 w-4" />}
                title="Wallet comes later"
                body="You only move into the wallet step after the order is created."
              />
              <AsideNote
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Entry still follows Tiko state"
                body="Event teams still validate entry through the live Tiko ticket state."
              />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function AsideNote(props: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <div className="mb-2 flex items-center gap-2 text-[color:var(--utility)]">
        {props.icon}
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
      </div>
      <p className="text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}

function CheckoutStage(props: {
  step: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-4 ${
        props.active
          ? "border-[color:rgba(169,43,31,0.18)] bg-[color:rgba(207,79,64,0.1)]"
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
