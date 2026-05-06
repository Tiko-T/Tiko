import { env } from "@/lib/env";
import { getOrderById, type OrderWithDetails } from "@/lib/tiko/orders";
import { listCatalog } from "@/lib/tiko/setup";
import { toServedEventImageSrc } from "@/lib/tiko/event-images";

import {
  formatDateTimeLabel,
  formatDayLabel,
  formatEventWindow,
  formatTokenAmount,
  shortenHash,
  titleFromScreamingSnake,
} from "./format";
import type {
  CatalogProductView,
  CheckInResultView,
  OrderView,
} from "./contracts";

type CatalogProductRecord = Awaited<ReturnType<typeof listCatalog>>[number];

function getAudienceProductDescription(slug: string, fallback: string) {
  if (slug === "global-access-pass") {
    return "Join the summit with one access pass for sessions, talks, and event-day entry, with your ticket unlocking after payment confirmation.";
  }

  return fallback;
}

function isFreeAmount(value: string) {
  return BigInt(value) === 0n;
}

export function toCatalogProductView(product: CatalogProductRecord): CatalogProductView {
  const isFree = isFreeAmount(product.unitPrice);
  const event = product.event
    ? {
        slug: product.event.slug,
        title: product.event.title,
        venue: product.event.venue,
        imageSrc: toServedEventImageSrc(product.event.imageSrc),
        startsAt: product.event.startsAt.toISOString(),
        endsAt: product.event.endsAt.toISOString(),
        windowLabel: formatEventWindow(
          product.event.startsAt.toISOString(),
          product.event.endsAt.toISOString()
        ),
        dayLabel: formatDayLabel(product.event.startsAt.toISOString()),
      }
    : null;

  const tier = product.ticketTier
    ? {
        name: product.ticketTier.name,
        supply: product.ticketTier.supply,
        sold: product.ticketTier.sold,
        remaining: Math.max(product.ticketTier.supply - product.ticketTier.sold, 0),
        availabilityLabel:
          product.ticketTier.supply - product.ticketTier.sold > 0
            ? `${product.ticketTier.supply - product.ticketTier.sold} passes left`
            : "Sold out",
      }
    : null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: getAudienceProductDescription(product.slug, product.description),
    kind: product.kind,
    isFree,
    priceDisplay: isFree
      ? "Free"
      : formatTokenAmount(
          product.unitPrice,
          env.CKB_TOKEN_DECIMALS,
          env.PRICE_DISPLAY_SYMBOL
        ),
    inventory: product.inventory,
    merchantName: product.merchant.name,
    detailsHref: `/products/${product.slug}`,
    checkoutHref: `/products/${product.slug}/checkout`,
    event,
    tier,
  };
}

function deriveOrderStage(order: OrderWithDetails): OrderView["stage"] {
  if (order.status === "FULFILLED") {
    return "ticket_ready";
  }

  if (order.sporeAsset?.mintStatus === "FAILED" || order.status === "FAILED") {
    return "failed";
  }

  if (
    order.status === "PAID" ||
    order.paymentIntent?.status === "SUBMITTED" ||
    order.paymentIntent?.status === "CONFIRMING" ||
    order.status === "PAYMENT_SUBMITTED"
  ) {
    return "confirming_payment";
  }

  return "awaiting_payment";
}

export function toOrderView(order: OrderWithDetails): OrderView {
  const decimals = order.paymentIntent?.token.decimals ?? env.CKB_TOKEN_DECIMALS;
  const displaySymbol = env.PRICE_DISPLAY_SYMBOL;
  const isFree = isFreeAmount(order.paymentAmount);
  const stage = deriveOrderStage(order);
  const event = order.product.event
    ? {
        slug: order.product.event.slug,
        title: order.product.event.title,
        venue: order.product.event.venue,
        startsAt: order.product.event.startsAt.toISOString(),
        endsAt: order.product.event.endsAt.toISOString(),
        windowLabel: formatEventWindow(
          order.product.event.startsAt.toISOString(),
          order.product.event.endsAt.toISOString()
        ),
        dayLabel: formatDayLabel(order.product.event.startsAt.toISOString()),
      }
    : null;

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    statusLabel:
      order.status === "FULFILLED"
        ? "Ticket ready"
        : order.status === "PAYMENT_SUBMITTED"
        ? "Payment submitted"
        : titleFromScreamingSnake(order.status),
    stage,
    buyer: {
      email: order.buyer.email,
      displayName: order.buyer.displayName ?? null,
    },
    product: {
      slug: order.product.slug,
      title: order.product.title,
      description: getAudienceProductDescription(
        order.product.slug,
        order.product.description
      ),
    },
    event,
    tierName: order.tier?.name ?? null,
    quantity: order.quantity,
    receiverAddress: order.receiverAddress,
    receiverAddressShort: order.receiverAddress
      ? shortenHash(order.receiverAddress, 14, 6)
      : "",
    payerAddress: order.payerAddress ?? null,
    payerAddressShort: order.payerAddress
      ? shortenHash(order.payerAddress, 14, 6)
      : null,
    pricing: {
      isFree,
      symbol: displaySymbol,
      decimals,
      unitAmount: order.unitPrice,
      totalAmount: order.totalAmount,
      paymentAmount: order.paymentAmount,
      unitDisplay:
        isFree ? "Free" : formatTokenAmount(order.unitPrice, decimals, displaySymbol),
      totalDisplay:
        isFree ? "Free" : formatTokenAmount(order.totalAmount, decimals, displaySymbol),
      paymentDisplay: isFree
        ? "Free"
        : formatTokenAmount(order.paymentAmount, decimals, displaySymbol),
    },
    payment: {
      status: order.paymentIntent?.status ?? (isFree ? "NOT_REQUIRED" : "PENDING"),
      statusLabel:
        isFree
          ? "No payment required"
          : order.paymentIntent?.status === "CONFIRMING"
          ? "Waiting for chain confirmation"
          : titleFromScreamingSnake(order.paymentIntent?.status ?? "PENDING"),
      confirmationsRequired: order.paymentIntent?.confirmationsRequired ?? 0,
      submittedTxHash: order.paymentIntent?.submittedTxHash ?? null,
      submittedTxHashShort: order.paymentIntent?.submittedTxHash
        ? shortenHash(order.paymentIntent.submittedTxHash)
        : null,
      confirmedTxHash: order.paymentIntent?.confirmedTxHash ?? null,
      confirmedTxHashShort: order.paymentIntent?.confirmedTxHash
        ? shortenHash(order.paymentIntent.confirmedTxHash)
        : null,
      expiresAt:
        order.paymentIntent?.expiresAt.toISOString() ?? order.createdAt.toISOString(),
      expiresAtLabel: formatDateTimeLabel(
        order.paymentIntent?.expiresAt.toISOString() ?? order.createdAt.toISOString()
      ),
    },
    ticket: order.entitlement
      ? {
          accessCode: order.entitlement.accessCode,
          qrPayload: order.entitlement.qrPayload,
          status: order.entitlement.status,
          statusLabel:
            order.entitlement.status === "CHECKED_IN"
              ? "Checked in"
              : titleFromScreamingSnake(order.entitlement.status),
          checkedInAt: order.entitlement.checkedInAt?.toISOString() ?? null,
          checkedInAtLabel: order.entitlement.checkedInAt
            ? formatDateTimeLabel(order.entitlement.checkedInAt.toISOString())
            : null,
        }
      : null,
    spore: order.sporeAsset
      ? {
          mintStatus: order.sporeAsset.mintStatus,
          mintStatusLabel:
            order.sporeAsset.mintStatus === "MINTED"
              ? "Collectible minted"
              : titleFromScreamingSnake(order.sporeAsset.mintStatus),
          mintTxHash: order.sporeAsset.mintTxHash ?? null,
          mintTxHashShort: order.sporeAsset.mintTxHash
            ? shortenHash(order.sporeAsset.mintTxHash)
            : null,
          sporeId: order.sporeAsset.sporeId ?? null,
        }
      : null,
    actions: {
      canSubmitTxHash:
        !isFree &&
        !order.paymentIntent?.submittedTxHash &&
        order.status !== "FULFILLED" &&
        order.status !== "FAILED",
      canRetryConfirmation:
        !isFree &&
        !!order.paymentIntent?.submittedTxHash &&
        order.status !== "FULFILLED" &&
        order.paymentIntent.status !== "CONFIRMED",
      readyForEntry:
        order.status === "FULFILLED" && order.entitlement?.status === "ACTIVE",
    },
  };
}

export async function getCatalogProducts() {
  const products = await listCatalog();
  return products.map(toCatalogProductView);
}

export async function getCatalogProductBySlug(slug: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getOrderViewById(orderId: string) {
  const order = await getOrderById(orderId);
  return order ? toOrderView(order) : null;
}

export function toCheckInResultView(result: {
  accessCode: string;
  status: string;
  checkedInAt: Date | null;
  event: {
    title: string;
    venue: string;
  };
  order: {
    reference: string;
  };
  buyer: {
    displayName: string | null;
    email: string;
  };
}): CheckInResultView {
  return {
    accessCode: result.accessCode,
    status: result.status,
    statusLabel:
      result.status === "CHECKED_IN"
        ? "Guest admitted"
        : titleFromScreamingSnake(result.status),
    checkedInAt: result.checkedInAt?.toISOString() ?? null,
    checkedInAtLabel: result.checkedInAt
      ? formatDateTimeLabel(result.checkedInAt.toISOString())
      : null,
    eventTitle: result.event.title,
    eventVenue: result.event.venue,
    orderReference: result.order.reference,
    buyerDisplayName: result.buyer.displayName,
    buyerEmail: result.buyer.email,
  };
}
