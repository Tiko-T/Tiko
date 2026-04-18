import { ProductKind } from "@prisma/client";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { syncSupportedPaymentToken } from "@/lib/tiko/setup";

type CreateEventListingInput = {
  organizerName: string;
  eventTitle: string;
  venue: string;
  startsAtIso: string;
  endsAtIso: string;
  ticketTitle: string;
  ticketTierName: string;
  description: string;
  ticketPrice: string;
  capacity: number;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

async function createUniqueSlug(
  baseValue: string,
  exists: (slug: string) => Promise<boolean>
) {
  const base = slugify(baseValue) || "event";

  if (!(await exists(base))) {
    return base;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;

    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique listing slug.");
}

function decimalPriceToUnits(value: string, decimals: number) {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Ticket price must be a valid positive number.");
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");

  if (fractionPart.length > decimals) {
    throw new Error(`Ticket price supports up to ${decimals} decimal places.`);
  }

  const units =
    BigInt(wholePart) * 10n ** BigInt(decimals) +
    BigInt(fractionPart.padEnd(decimals, "0") || "0");

  if (units <= 0n) {
    throw new Error("Ticket price must be greater than zero.");
  }

  return units.toString();
}

export async function createEventListing(input: CreateEventListingInput) {
  const startsAt = new Date(input.startsAtIso);
  const endsAt = new Date(input.endsAtIso);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Start and end times must be valid dates.");
  }

  if (endsAt <= startsAt) {
    throw new Error("Event end time must be after the start time.");
  }

  const paymentToken = await syncSupportedPaymentToken();
  const unitPrice = decimalPriceToUnits(input.ticketPrice, env.CKB_TOKEN_DECIMALS);

  return db.$transaction(async (tx) => {
    const merchantSlug = slugify(input.organizerName) || "organizer";
    const merchant = await tx.merchant.upsert({
      where: { slug: merchantSlug },
      update: {
        name: input.organizerName,
        settlementAddress: paymentToken.receiverAddress,
      },
      create: {
        slug: merchantSlug,
        name: input.organizerName,
        settlementAddress: paymentToken.receiverAddress,
      },
    });

    const eventSlug = await createUniqueSlug(input.eventTitle, async (slug) => {
      const existing = await tx.event.findUnique({
        where: { slug },
        select: { id: true },
      });

      return !!existing;
    });

    const productSlug = await createUniqueSlug(input.ticketTitle, async (slug) => {
      const existing = await tx.product.findUnique({
        where: { slug },
        select: { id: true },
      });

      return !!existing;
    });

    const event = await tx.event.create({
      data: {
        merchantId: merchant.id,
        slug: eventSlug,
        title: input.eventTitle,
        venue: input.venue,
        startsAt,
        endsAt,
      },
    });

    const product = await tx.product.create({
      data: {
        merchantId: merchant.id,
        eventId: event.id,
        slug: productSlug,
        title: input.ticketTitle,
        description: input.description,
        kind: ProductKind.TICKET,
        unitPrice,
        inventory: input.capacity,
      },
    });

    await tx.ticketTier.create({
      data: {
        eventId: event.id,
        productId: product.id,
        name: input.ticketTierName,
        supply: input.capacity,
      },
    });

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        merchant: true,
        event: true,
        ticketTier: true,
      },
    });
  });
}
