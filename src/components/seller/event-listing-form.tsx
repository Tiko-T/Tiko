"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { tikoApi } from "@/lib/frontend/api";

const MAX_EVENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function EventListingForm(props: { paymentSymbol: string }) {
  const router = useRouter();
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const eventImagePreviewRef = useRef<string | null>(null);
  const [organizerName, setOrganizerName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [pricingMode, setPricingMode] = useState<"paid" | "free">("paid");
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreviewUrl, setEventImagePreviewUrl] = useState<string | null>(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketTierName, setTicketTierName] = useState("General Admission");
  const [description, setDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (eventImagePreviewRef.current) {
        URL.revokeObjectURL(eventImagePreviewRef.current);
      }
    };
  }, []);

  function clearEventImage() {
    setEventImageFile(null);
    setEventImagePreviewUrl(null);

    if (eventImagePreviewRef.current) {
      URL.revokeObjectURL(eventImagePreviewRef.current);
      eventImagePreviewRef.current = null;
    }

    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
  }

  function handleEventImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearEventImage();
      return;
    }

    if (file.size > MAX_EVENT_IMAGE_SIZE_BYTES) {
      setError("Event image must be 5 MB or smaller.");
      clearEventImage();
      return;
    }

    if (eventImagePreviewRef.current) {
      URL.revokeObjectURL(eventImagePreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    eventImagePreviewRef.current = previewUrl;

    setError(null);
    setEventImageFile(file);
    setEventImagePreviewUrl(previewUrl);
  }

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
        pricingMode,
        eventImageFile,
        ticketTitle,
        ticketTierName,
        description,
        ticketPrice: pricingMode === "paid" ? ticketPrice : undefined,
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
        <p className="eyebrow text-[color:var(--accent-strong)]">Listing details</p>
        <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)]">
          Add the event, ticket, and description.
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          Fill in the essentials and publish.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <FormSection eyebrow="Event" title="Basic event information">
          <div className="grid gap-5 md:grid-cols-2">
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
          </div>

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

          <div className="grid gap-5 md:grid-cols-2">
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

          <Field label="Event image">
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[1.25rem] border border-dashed border-[color:var(--line-strong)] bg-[color:rgba(255,255,255,0.52)] px-4 py-4 text-sm text-[color:var(--ink)] transition hover:border-[color:var(--accent-strong)]">
                <span className="font-medium text-[color:var(--ink)]">Choose image</span>
                <span className="text-sm text-[color:var(--muted)]">Up to 5 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  ref={eventImageInputRef}
                  onChange={handleEventImageChange}
                  className="sr-only"
                />
              </label>

              {eventImageFile ? (
                <div className="space-y-3 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.62)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[color:var(--ink)]">
                      {eventImageFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={clearEventImage}
                      className="text-sm font-medium text-[color:var(--accent-strong)] transition hover:text-[color:var(--ink)]"
                    >
                      Remove
                    </button>
                  </div>

                  {eventImagePreviewUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-input)]">
                      <Image
                        src={eventImagePreviewUrl}
                        alt="Selected event preview"
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 40rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Field>
        </FormSection>

        <FormSection eyebrow="Ticket" title="What buyers are purchasing">
          <div className="space-y-3">
            <div className="inline-flex rounded-[1.2rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.48)] p-1">
              <button
                type="button"
                onClick={() => setPricingMode("paid")}
                className={`rounded-[1rem] px-4 py-2 text-sm font-medium transition ${
                  pricingMode === "paid"
                    ? "bg-[color:var(--ink)] text-white"
                    : "text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setPricingMode("free")}
                className={`rounded-[1rem] px-4 py-2 text-sm font-medium transition ${
                  pricingMode === "free"
                    ? "bg-[color:var(--ink)] text-white"
                    : "text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                }`}
              >
                Free
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={pricingMode === "paid" ? `Price (${props.paymentSymbol})` : "Price"}>
              <input
                type="text"
                required={pricingMode === "paid"}
                disabled={pricingMode === "free"}
                inputMode="decimal"
                value={pricingMode === "paid" ? ticketPrice : ""}
                onChange={(event) => setTicketPrice(event.target.value)}
                className={`${inputClasses} ${
                  pricingMode === "free" ? "cursor-not-allowed opacity-60" : ""
                }`}
                placeholder={pricingMode === "paid" ? "25.00" : "Free"}
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
        </FormSection>

        <FormSection eyebrow="Description" title="Description">
          <Field label="Event description">
            <textarea
              required
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClasses}
              placeholder="Describe what the ticket includes, what kind of event this is, and what buyers should expect."
            />
          </Field>
        </FormSection>
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
          Back
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
              Publishing…
            </>
          ) : (
            <>
              Publish event
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
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-[color:var(--ink)]">{props.label}</span>
        {props.hint ? (
          <p className="text-sm leading-6 text-[color:var(--muted)]">{props.hint}</p>
        ) : null}
      </div>
      {props.children}
    </label>
  );
}

function FormSection(props: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.52)] p-5 sm:p-6">
      <div className="space-y-2">
        <p className="eyebrow text-[color:var(--muted)]">{props.eyebrow}</p>
        <h3 className="text-xl font-semibold text-[color:var(--ink)]">{props.title}</h3>
        {props.description ? (
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            {props.description}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">{props.children}</div>
    </section>
  );
}

const inputClasses =
  "h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]";

const textareaClasses =
  "w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]";
