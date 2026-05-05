import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { StatusBadge } from "@/components/common/status-badge";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getEventArtwork } from "@/lib/frontend/imagery";
import { getCatalogProductBySlug } from "@/lib/frontend/server-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const artwork = getEventArtwork({
    imageSrc: product.event?.imageSrc,
    title: product.event?.title ?? product.title,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/#lineup"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lineup
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_25rem]">
          <div className="section-card-dark overflow-hidden rounded-[2.75rem] p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow text-white/82">Event pass</p>
              <StatusBadge
                label={product.tier?.availabilityLabel ?? "Inventory live"}
                tone={product.tier?.remaining === 0 ? "muted" : "accent"}
              />
            </div>

            <div className="mt-8 max-w-3xl space-y-5 text-white">
              <p className="eyebrow text-white/82">{product.event?.dayLabel ?? "Schedule pending"}</p>
              <h1 className="font-[family:var(--font-display)] text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
                {product.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/90 sm:text-lg">
                {product.description}
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <DetailCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="Schedule"
                value={product.event?.windowLabel ?? "Schedule pending"}
                hint={product.event?.dayLabel ?? "Date pending"}
              />
              <DetailCard
                icon={<MapPin className="h-5 w-5" />}
                label="Venue"
                value={product.event?.venue ?? "Venue pending"}
                hint={`Presented by ${product.merchantName}`}
              />
              <DetailCard
                icon={<Ticket className="h-5 w-5" />}
                label="Ticket"
                value={product.tier?.name ?? "General admission"}
                hint={product.tier?.availabilityLabel ?? "Inventory live"}
              />
            </div>
          </div>

          <aside className="section-card rounded-[2.25rem] p-6 sm:p-8 lg:sticky lg:top-28 lg:h-fit">
            <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-[1.8rem] border border-[color:var(--line)]">
              <Image
                src={artwork.portraitSrc}
                alt={artwork.portraitAlt}
                fill
                priority
                unoptimized={artwork.unoptimized}
                sizes="(min-width: 1024px) 25rem, 100vw"
                className="object-cover"
              />
            </div>
            <p className="eyebrow text-[color:var(--muted)]">Booking</p>
            <div className="mt-5 space-y-3">
              <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
                Reserve your place.
              </h2>
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                Complete the booking form and your ticket will be ready for entry.
              </p>
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5">
              <p className="eyebrow text-[color:var(--muted)]">Ticket</p>
              <p className="mt-3 font-[family:var(--font-display)] text-5xl text-[color:var(--ink)]">
                {product.priceDisplay}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {product.tier?.name ?? "Featured pass"} · {product.tier?.availabilityLabel}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={product.checkoutHref}
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  block: true,
                })}
              >
                Book now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              <FeaturePoint
                icon={<Wallet className="h-4 w-4" />}
                title="Booking"
                body="Use your contact details to complete the booking and receive your ticket."
              />
              <FeaturePoint
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Digital ticket access"
                body="Your ticket stays available online, so you can open it again whenever you need it."
              />
              <FeaturePoint
                icon={<Sparkles className="h-4 w-4" />}
                title="Ready for entry"
                body="Bring your ticket on the day and have it ready to show at the venue."
              />
            </div>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="section-card rounded-[2.25rem] p-6 sm:p-8">
            <div className="space-y-3">
              <p className="eyebrow text-[color:var(--accent-strong)]">Need to know</p>
              <h2 className="font-[family:var(--font-display)] text-4xl text-[color:var(--ink)]">
                Before you book
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <NeedToKnow
                title="Event timing"
                body={product.event?.windowLabel ?? "Schedule pending"}
              />
              <NeedToKnow
                title="Venue"
                body={product.event?.venue ?? "Venue pending"}
              />
              <NeedToKnow
                title="Organizer"
                body={product.merchantName}
              />
              <NeedToKnow
                title="Availability"
                body={product.tier?.availabilityLabel ?? "Inventory live"}
              />
            </div>
          </div>

          <div className="section-card rounded-[2.25rem] p-6 sm:p-8">
            <p className="eyebrow text-[color:var(--muted)]">After booking</p>
            <div className="mt-5 space-y-4">
              <JourneyStep
                step="01"
                title="Complete booking"
                body="Enter your details and continue through the booking flow."
              />
              <JourneyStep
                step="02"
                title="Receive ticket"
                body="Your ticket is issued as soon as the booking is confirmed."
              />
              <JourneyStep
                step="03"
                title="Open your ticket"
                body="Your ticket will be ready online so you can bring it with you on the day."
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function DetailCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.65rem] border border-white/12 bg-[color:rgba(255,248,245,0.11)] p-5 text-white/92">
      <div className="flex items-center gap-3 text-white">
        {props.icon}
        <p className="eyebrow text-white/78">{props.label}</p>
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-sm text-white/82">{props.hint}</p>
    </div>
  );
}

function FeaturePoint(props: {
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

function NeedToKnow(props: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.title}</p>
      <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">{props.body}</p>
    </div>
  );
}

function JourneyStep(props: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
        <span className="eyebrow text-[color:var(--muted)]">{props.step}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}
