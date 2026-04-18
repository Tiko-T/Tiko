"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { tikoApi } from "@/lib/frontend/api";

export function EventListingForm(props: { paymentSymbol: string }) {
  const router = useRouter();
  const [organizerName, setOrganizerName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketTierName, setTicketTierName] = useState("General Admission");
  const [description, setDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const product = await tikoApi.createEventListing({
        organizerName,
        eventTitle,
        venue,
        startsAtIso: new Date(startsAtLocal).toISOString(),
        endsAtIso: new Date(endsAtLocal).toISOString(),
        ticketTitle,
        ticketTierName,
        description,
        ticketPrice,
        capacity: Number(capacity),
      });

      startTransition(() => {
        router.push(product.detailsHref);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create listing."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card rounded-[2.25rem] p-6 sm:p-8">
      <div className="space-y-3">
        <p className="eyebrow text-[color:var(--accent-strong)]">Create a listing</p>
        <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
          Put a live event on sale from the UI.
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          Add the event details, ticket information, and sale amount. Once you submit,
          the listing appears on the storefront and can start taking orders.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="eyebrow text-[color:var(--muted)]">Organizer</p>
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              Who is running this event?
            </h3>
          </div>

          <Field label="Organizer or brand name">
            <input
              type="text"
              required
              value={organizerName}
              onChange={(event) => setOrganizerName(event.target.value)}
              className={inputClasses}
              placeholder="Example Events"
            />
          </Field>

          <Field label="Event title">
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(event) => setEventTitle(event.target.value)}
              className={inputClasses}
              placeholder="City Design Summit 2026"
            />
          </Field>

          <Field label="Venue">
            <input
              type="text"
              required
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className={inputClasses}
              placeholder="KICC, Nairobi"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Start date and time">
              <input
                type="datetime-local"
                required
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="End date and time">
              <input
                type="datetime-local"
                required
                value={endsAtLocal}
                onChange={(event) => setEndsAtLocal(event.target.value)}
                className={inputClasses}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="eyebrow text-[color:var(--muted)]">Ticket setup</p>
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              What will buyers purchase?
            </h3>
          </div>

          <Field label="Ticket listing title">
            <input
              type="text"
              required
              value={ticketTitle}
              onChange={(event) => setTicketTitle(event.target.value)}
              className={inputClasses}
              placeholder="Weekend Access Pass"
            />
          </Field>

          <Field label="Ticket tier name">
            <input
              type="text"
              required
              value={ticketTierName}
              onChange={(event) => setTicketTierName(event.target.value)}
              className={inputClasses}
              placeholder="General Admission"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={`Price (${props.paymentSymbol})`}>
              <input
                type="text"
                required
                inputMode="decimal"
                value={ticketPrice}
                onChange={(event) => setTicketPrice(event.target.value)}
                className={inputClasses}
                placeholder="25.00"
              />
            </Field>
            <Field label="Ticket quantity">
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className={inputClasses}
                placeholder="100"
              />
            </Field>
          </div>

          <Field label="Buyer-facing description">
            <textarea
              required
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClasses}
              placeholder="Describe what the ticket includes, what kind of event this is, and what buyers should expect."
            />
          </Field>
        </section>
      </div>

      {error ? (
        <div className="mt-6 rounded-[1rem] border border-[color:rgba(151,37,45,0.16)] bg-[color:rgba(151,37,45,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className={buttonClasses({
            variant: "ghost",
            size: "sm",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

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
              Creating listing…
            </>
          ) : (
            <>
              List this event
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[color:var(--ink)]">{props.label}</span>
      {props.children}
    </label>
  );
}

const inputClasses =
  "h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]";

const textareaClasses =
  "w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]";
