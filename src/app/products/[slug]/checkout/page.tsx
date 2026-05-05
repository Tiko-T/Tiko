import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Ticket } from "lucide-react";
import Link from "next/link";

import { CheckoutForm } from "@/components/buyer/checkout-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireSignedInUser } from "@/lib/auth/page-guards";
import { getCatalogProductBySlug } from "@/lib/frontend/server-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await requireSignedInUser(`/products/${slug}/checkout`);
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
                <p className="eyebrow text-[color:var(--accent-strong)]">Booking</p>
                <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                  Finish your booking.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                  Enter the details for this booking and continue.
                </p>
              </div>
            </section>

            <CheckoutForm product={product} currentUser={currentUser} />
          </div>

          <aside className="section-card space-y-5 rounded-[2.25rem] p-6 sm:p-8 xl:sticky xl:top-28 xl:h-fit">
            <div>
              <p className="eyebrow text-[color:var(--muted)]">Order summary</p>
              <h2 className="mt-3 font-[family:var(--font-display)] text-4xl text-[color:var(--ink)]">
                {product.title}
              </h2>
            </div>

            <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5">
              <p className="eyebrow text-[color:var(--muted)]">Ticket</p>
              <p className="mt-3 font-[family:var(--font-display)] text-5xl text-[color:var(--ink)]">
                {product.priceDisplay}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {product.tier?.name ?? "Featured pass"} · {product.tier?.availabilityLabel}
              </p>
            </div>

            <SummaryRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Event time"
              value={product.event?.windowLabel ?? "Schedule pending"}
            />
            <SummaryRow
              icon={<Ticket className="h-4 w-4" />}
              label="Ticket"
              value={product.tier?.name ?? "General admission"}
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SummaryRow(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] px-4 py-3">
      <div className="flex items-center gap-2 text-[color:var(--utility)]">
        {props.icon}
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{props.value}</p>
    </div>
  );
}
