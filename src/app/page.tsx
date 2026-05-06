import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  ScanLine,
  ShieldCheck,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { StatusBadge } from "@/components/common/status-badge";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { CatalogProductView } from "@/lib/frontend/contracts";
import { getEventArtwork } from "@/lib/frontend/imagery";
import { getCatalogProducts } from "@/lib/frontend/server-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const eventTypes = [
  "Concerts",
  "Festivals",
  "Summits",
  "Workshops",
  "Screenings",
  "Community events",
];

export default async function Home() {
  const products = await getCatalogProducts();
  const available = products.filter(
    (product) => (product.tier?.remaining ?? product.inventory) > 0
  );
  const soldOut = products.filter((product) => product.tier?.remaining === 0);
  const lineup = [...available, ...soldOut];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-5 py-8 sm:px-8 sm:py-12">
        <section className="section-card-dark relative overflow-hidden rounded-[2.9rem]">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/events/home-hero-stage-poster.jpg"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/videos/home-hero-stage-web.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(17,9,7,0.92)_0%,rgba(17,9,7,0.82)_34%,rgba(17,9,7,0.54)_62%,rgba(17,9,7,0.74)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(207,79,64,0.18),transparent_30%)]" />

          <div className="relative z-10 grid gap-8 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1.15fr)_23rem]">
            <div className="space-y-8 text-white">
              <div className="space-y-4">
                <p className="eyebrow animate-rise text-white/78">
                  Ticketing and creator commerce in one place
                </p>
                <h1 className="animate-rise [animation-delay:120ms] font-[family:var(--font-display)] text-5xl leading-[0.88] sm:text-6xl lg:text-7xl">
                  Run ticketing, creator commerce, and event entry from one place.
                </h1>
                <p className="animate-rise max-w-2xl [animation-delay:220ms] text-base leading-8 text-white/88 sm:text-lg">
                  Publish events, sell creator-led experiences and digital offerings, and keep booking, ticket access, and check-in in sync.
                </p>
              </div>

              <div className="animate-rise flex flex-col gap-3 [animation-delay:320ms] sm:flex-row">
                <Link
                  href="/#lineup"
                  className={buttonClasses({
                    variant: "primary",
                    size: "lg",
                  })}
                >
                  Browse events
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="grid gap-4 pt-2 md:grid-cols-3">
                <HeroMetric
                  label="Live now"
                  value={available.length ? `${available.length}` : "0"}
                  body="Events currently open for booking."
                />
                <HeroMetric
                  label="Booking flow"
                  value="Simple"
                  body="Ticketing, checkout, and entry in one flow."
                />
                <HeroMetric
                  label="Creator commerce"
                  value="Built in"
                  body="Sell access, drops, and event-led offers from the same platform."
                />
              </div>
            </div>

            <aside className="self-end rounded-[2rem] border border-white/12 bg-[color:rgba(20,11,9,0.9)] p-6 shadow-[0_20px_60px_rgba(10,5,4,0.26)]">
              <p className="eyebrow text-white/76">Made for</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <EventTypeChip key={type} label={type} />
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <HeroPanel
                  icon={<Ticket className="h-4 w-4" />}
                  title="For attendees"
                  body="Find events, book quickly, and keep one live ticket on hand."
                />
                <HeroPanel
                  icon={<Users className="h-4 w-4" />}
                  title="For creators and teams"
                  body="Publish events, manage ticketing, and sell creator-led offers from one operating surface."
                />
              </div>
            </aside>
          </div>
        </section>

        <section id="lineup" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="eyebrow text-[color:var(--accent-strong)]">Live now</p>
              <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                Events open for booking
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={`${available.length} live`} tone="accent" />
              {soldOut.length ? (
                <StatusBadge label={`${soldOut.length} sold out`} tone="muted" />
              ) : null}
            </div>
          </div>

          {lineup.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {lineup.map((product) => (
                <SellingEventCard key={product.id} product={product} />
              ))}
              {lineup.length < 3 ? <SellerSupportCard /> : null}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <EmptyLineupCard />
              <SellerSupportCard />
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <AudienceCard
            eyebrow="Attending?"
            title="Book faster."
            body="See the date, venue, and ticket details in one place, then book and keep your entry credential ready."
            icon={<Ticket className="h-5 w-5" />}
            ctaHref="/#lineup"
            ctaLabel="Find your ticket"
          />
          <AudienceCard
            eyebrow="Hosting?"
            title="Run ticketing and creator commerce together."
            body="Publish paid or free events, sell creator-led offers, issue active tickets, and validate guests from one system."
            icon={<ShieldCheck className="h-5 w-5" />}
            ctaHref="/sell"
            ctaLabel="List an event"
          />
        </section>

        <section id="flow" className="grid gap-5 lg:grid-cols-3">
          <FlowCard
            icon={<CalendarDays className="h-5 w-5" />}
            step="01"
            title="Choose the event"
            body="Start with the date, venue, and ticket details."
          />
          <FlowCard
            icon={<Wallet className="h-5 w-5" />}
            step="02"
            title="Complete booking"
            body="Enter your details and continue through the booking flow."
          />
          <FlowCard
            icon={<ScanLine className="h-5 w-5" />}
            step="03"
            title="Use your ticket"
            body="Your QR ticket stays ready for entry on the day."
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SellingEventCard(props: { product: CatalogProductView }) {
  const artwork = getEventArtwork({
    imageSrc: props.product.event?.imageSrc,
    title: props.product.event?.title ?? props.product.title,
  });
  const available = (props.product.tier?.remaining ?? props.product.inventory) > 0;

  return (
    <article className="group section-card overflow-hidden rounded-[2rem]">
      <div className="relative aspect-[5/4] overflow-hidden">
        <Image
          src={artwork.squareSrc}
          alt={artwork.squareAlt}
          fill
          unoptimized={artwork.unoptimized}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(19,9,8,0.06)_0%,rgba(19,9,8,0.3)_54%,rgba(19,9,8,0.88)_100%)]" />
        <div className="absolute left-4 top-4">
          <StatusBadge
            label={props.product.tier?.availabilityLabel ?? "Inventory live"}
            tone={available ? "accent" : "muted"}
          />
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <p className="eyebrow text-white/82">
            {props.product.event?.dayLabel ?? "Date pending"}
          </p>
          <h3 className="mt-2 font-[family:var(--font-display)] text-4xl leading-[0.95] text-white">
            {props.product.title}
          </h3>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-7 text-[color:var(--muted)]">
          {props.product.description}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <EventMeta
            icon={<MapPin className="h-4 w-4" />}
            label="Venue"
            value={props.product.event?.venue ?? "Venue pending"}
          />
          <EventMeta
            icon={<Ticket className="h-4 w-4" />}
            label="From"
            value={props.product.priceDisplay}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={props.product.detailsHref}
            className={buttonClasses({
              variant: "secondary",
              size: "md",
              block: true,
            })}
          >
            View details
          </Link>
          {available ? (
            <Link
              href={props.product.checkoutHref}
              className={buttonClasses({
                variant: "primary",
                size: "md",
                block: true,
              })}
            >
              Get ticket
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyLineupCard() {
  return (
    <article className="section-card rounded-[2rem] p-6 sm:p-8">
      <p className="eyebrow text-[color:var(--muted)]">No live events right now</p>
      <h3 className="mt-4 font-[family:var(--font-display)] text-4xl text-[color:var(--ink)]">
        New events will appear here.
      </h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
        As soon as an event opens for booking, it will appear here.
      </p>
    </article>
  );
}

function SellerSupportCard() {
  return (
    <article className="section-card rounded-[2rem] p-6 sm:p-8">
      <p className="eyebrow text-[color:var(--accent-strong)]">Running an event?</p>
      <h3 className="mt-4 font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
        Publish once. Run entry from the same place.
      </h3>
      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
        Keep the booking page and check-in flow aligned for your team and guests.
      </p>
      <div className="mt-6">
        <Link
          href="/sell"
          className={buttonClasses({
            variant: "secondary",
            size: "md",
          })}
        >
          List an event
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function FlowCard(props: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <article className="section-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[color:rgba(207,79,64,0.12)] text-[color:var(--accent-strong)]">
          {props.icon}
        </div>
        <span className="eyebrow text-[color:var(--muted)]">{props.step}</span>
      </div>
      <div className="mt-6 space-y-3">
        <h3 className="font-[family:var(--font-display)] text-3xl leading-tight text-[color:var(--ink)]">
          {props.title}
        </h3>
        <p className="text-sm leading-7 text-[color:var(--muted)]">{props.body}</p>
      </div>
    </article>
  );
}

function HeroMetric(props: { label: string; value: string; body: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/12 bg-[color:rgba(255,248,245,0.09)] p-4">
      <p className="eyebrow text-white/78">{props.label}</p>
      <p className="mt-3 font-[family:var(--font-display)] text-4xl text-white">
        {props.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/82">{props.body}</p>
    </div>
  );
}

function HeroPanel(props: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/12 bg-[color:rgba(255,248,245,0.08)] p-4">
      <div className="flex items-center gap-2 text-white">
        {props.icon}
        <p className="text-sm font-semibold">{props.title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/82">{props.body}</p>
    </div>
  );
}

function EventTypeChip(props: { label: string }) {
  return (
    <span className="rounded-full border border-white/14 bg-[color:rgba(255,248,245,0.08)] px-3 py-1.5 text-sm text-white/84">
      {props.label}
    </span>
  );
}

function AudienceCard(props: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <article className="section-card rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center gap-3 text-[color:var(--utility)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[color:var(--utility-soft)]">
          {props.icon}
        </div>
        <p className="eyebrow text-[color:var(--accent-strong)]">{props.eyebrow}</p>
      </div>
      <h3 className="mt-4 font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
        {props.title}
      </h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
        {props.body}
      </p>
      <div className="mt-6">
        <Link
          href={props.ctaHref}
          className={buttonClasses({
            variant: "secondary",
            size: "md",
          })}
        >
          {props.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function EventMeta(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <div className="flex items-center gap-2 text-[color:var(--utility)]">
        {props.icon}
        <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">{props.value}</p>
    </div>
  );
}
