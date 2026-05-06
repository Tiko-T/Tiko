import { z } from "zod";

export const catalogProductViewSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  kind: z.enum(["TICKET", "DIGITAL_COLLECTIBLE", "MEMBERSHIP"]),
  isFree: z.boolean(),
  priceDisplay: z.string(),
  inventory: z.number().int(),
  merchantName: z.string(),
  detailsHref: z.string(),
  checkoutHref: z.string(),
  event: z
    .object({
      slug: z.string(),
      title: z.string(),
      venue: z.string(),
      imageSrc: z.string().nullable(),
      startsAt: z.string(),
      endsAt: z.string(),
      windowLabel: z.string(),
      dayLabel: z.string(),
    })
    .nullable(),
  tier: z
    .object({
      name: z.string(),
      supply: z.number().int(),
      sold: z.number().int(),
      remaining: z.number().int(),
      availabilityLabel: z.string(),
    })
    .nullable(),
});

const orderBuyerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().nullable(),
});

const orderEventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  venue: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  windowLabel: z.string(),
  dayLabel: z.string(),
});

const orderTicketSchema = z.object({
  accessCode: z.string(),
  qrPayload: z.string(),
  status: z.string(),
  statusLabel: z.string(),
  checkedInAt: z.string().nullable(),
  checkedInAtLabel: z.string().nullable(),
});

const orderSporeSchema = z.object({
  mintStatus: z.string(),
  mintStatusLabel: z.string(),
  mintTxHash: z.string().nullable(),
  mintTxHashShort: z.string().nullable(),
  sporeId: z.string().nullable(),
});

export const orderViewSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: z.string(),
  statusLabel: z.string(),
  stage: z.enum([
    "awaiting_payment",
    "confirming_payment",
    "ticket_ready",
    "failed",
  ]),
  buyer: orderBuyerSchema,
  product: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  event: orderEventSchema.nullable(),
  tierName: z.string().nullable(),
  quantity: z.number().int(),
  receiverAddress: z.string(),
  receiverAddressShort: z.string(),
  payerAddress: z.string().nullable(),
  payerAddressShort: z.string().nullable(),
  pricing: z.object({
    isFree: z.boolean(),
    symbol: z.string(),
    decimals: z.number().int(),
    unitAmount: z.string(),
    totalAmount: z.string(),
    paymentAmount: z.string(),
    unitDisplay: z.string(),
    totalDisplay: z.string(),
    paymentDisplay: z.string(),
  }),
  payment: z.object({
    status: z.string(),
    statusLabel: z.string(),
    confirmationsRequired: z.number().int(),
    submittedTxHash: z.string().nullable(),
    submittedTxHashShort: z.string().nullable(),
    confirmedTxHash: z.string().nullable(),
    confirmedTxHashShort: z.string().nullable(),
    expiresAt: z.string(),
    expiresAtLabel: z.string(),
  }),
  ticket: orderTicketSchema.nullable(),
  spore: orderSporeSchema.nullable(),
  actions: z.object({
    canSubmitTxHash: z.boolean(),
    canRetryConfirmation: z.boolean(),
    readyForEntry: z.boolean(),
  }),
});

export const checkInResultViewSchema = z.object({
  accessCode: z.string(),
  status: z.string(),
  statusLabel: z.string(),
  checkedInAt: z.string().nullable(),
  checkedInAtLabel: z.string().nullable(),
  eventTitle: z.string(),
  eventVenue: z.string(),
  orderReference: z.string(),
  buyerDisplayName: z.string().nullable(),
  buyerEmail: z.string().email(),
});

export const faucetViewSchema = z.object({
  walletAddress: z.string(),
  claimAmountDisplay: z.string(),
  maxPerWalletDisplay: z.string(),
  remainingAmountDisplay: z.string(),
  txHash: z.string().nullable(),
});

export type CatalogProductView = z.infer<typeof catalogProductViewSchema>;
export type OrderView = z.infer<typeof orderViewSchema>;
export type CheckInResultView = z.infer<typeof checkInResultViewSchema>;
export type FaucetView = z.infer<typeof faucetViewSchema>;

export function orderNeedsTxHash(order: OrderView) {
  return order.actions.canSubmitTxHash;
}

export function orderNeedsConfirmation(order: OrderView) {
  return order.actions.canRetryConfirmation;
}

export function orderReadyForEntry(order: OrderView) {
  return order.actions.readyForEntry;
}

export function extractAccessCode(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const payload = JSON.parse(trimmed);

    if (
      payload &&
      typeof payload === "object" &&
      "accessCode" in payload &&
      typeof payload.accessCode === "string"
    ) {
      return payload.accessCode.trim();
    }
  } catch {}

  return trimmed;
}
