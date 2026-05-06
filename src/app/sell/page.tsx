import { EventListingForm } from "@/components/seller/event-listing-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireStaffUser } from "@/lib/auth/page-guards";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export default async function SellPage() {
  await requireStaffUser("/sell");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
        <section className="section-card rounded-[2.5rem] px-6 py-8 sm:px-8 sm:py-9">
          <div className="space-y-3">
            <p className="eyebrow text-[color:var(--accent-strong)]">Create event</p>
            <h1 className="max-w-3xl font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
              Create a clean event listing.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
              Add the details and publish.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <EventListingForm paymentSymbol={env.PRICE_DISPLAY_SYMBOL} />

          <aside className="space-y-4 xl:sticky xl:top-28 xl:h-fit">
            <div className="section-card rounded-[2rem] p-6">
              <p className="eyebrow text-[color:var(--muted)]">Before publish</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
                <p>Check the title, venue, and date.</p>
                <p>Make sure the ticket setup is right.</p>
                <p>Keep the description short and clear.</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.45)] p-6">
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                If you set a price, it is displayed in {env.PRICE_DISPLAY_SYMBOL}.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
