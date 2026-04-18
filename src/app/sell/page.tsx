import { CalendarDays, ShieldCheck, Ticket, Wallet } from "lucide-react";

import { EventListingForm } from "@/components/seller/event-listing-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export default function SellPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_25rem]">
          <div className="space-y-6">
            <section className="section-card rounded-[2.5rem] px-6 py-8 sm:px-8">
              <div className="space-y-3">
                <p className="eyebrow text-[color:var(--accent-strong)]">For event teams</p>
                <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                  Create an event listing that can start selling immediately.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                  Use this page to add a live event, set the ticket details, and publish
                  it to the storefront. Buyers can then move from discovery to payment
                  and entry through the same product flow.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SellerNote
                  icon={<Ticket className="h-4 w-4" />}
                  title="One listing, one ticket flow"
                  body="The event page, checkout, payment confirmation, and QR pass all follow from the listing you create here."
                />
                <SellerNote
                  icon={<Wallet className="h-4 w-4" />}
                  title={`Price uses ${env.CKB_TOKEN_SYMBOL}`}
                  body="Set the ticket amount as a normal decimal price. Tiko converts it into the token units used by the payment flow."
                />
                <SellerNote
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Live schedule and venue"
                  body="The details you enter here appear on the buyer-facing event page and storefront cards."
                />
                <SellerNote
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Check-in stays aligned"
                  body="Tickets created from this listing are the same tickets used later by the event team at entry."
                />
              </div>
            </section>

            <EventListingForm paymentSymbol={env.CKB_TOKEN_SYMBOL} />
          </div>

          <aside className="section-card rounded-[2.25rem] p-6 sm:p-8 xl:sticky xl:top-28 xl:h-fit">
            <p className="eyebrow text-[color:var(--muted)]">What you will publish</p>
            <div className="mt-5 space-y-4">
              <SidePoint
                title="Event details"
                body="Title, venue, date, and time for the storefront and event page."
              />
              <SidePoint
                title="Ticket details"
                body="The buyer-facing ticket title, tier label, price, and available quantity."
              />
              <SidePoint
                title="Buyer description"
                body="A clear explanation of what the ticket includes and what attendees should expect."
              />
              <SidePoint
                title="Live destination"
                body="After submission, Tiko redirects you straight to the event listing that buyers will see."
              />
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SellerNote(props: {
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

function SidePoint(props: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}
