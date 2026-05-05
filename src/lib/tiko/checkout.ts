import { ProductKind } from "@prisma/client";
import { customAlphabet } from "nanoid";

import { db } from "@/lib/db";
import { env, toPrismaNetwork } from "@/lib/env";

import { getOrderOrThrow } from "./orders";
import { fulfillFreeOrder } from "./fulfillment";
import { syncSupportedPaymentToken } from "./setup";

const orderReference = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export async function createCheckoutOrder(input: {
  buyerEmail: string;
  buyerDisplayName?: string;
  productSlug?: string;
  productId?: string;
  quantity?: number;
}) {
  const quantity = input.quantity ?? 1;

  if (!input.productSlug && !input.productId) {
    throw new Error("productId or productSlug is required");
  }

  if (quantity < 1) {
    throw new Error("quantity must be at least 1");
  }

  const product = await db.product.findFirst({
    where: input.productId ? { id: input.productId } : { slug: input.productSlug },
    include: {
      merchant: true,
      event: true,
      ticketTier: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.kind === ProductKind.TICKET && quantity !== 1) {
    throw new Error("Ticket checkout currently supports quantity=1 only");
  }

  if (!product.ticketTier && product.kind === ProductKind.TICKET) {
    throw new Error("Ticket tier configuration is missing");
  }

  if (product.ticketTier && product.ticketTier.sold >= product.ticketTier.supply) {
    throw new Error("The selected ticket tier is sold out");
  }

  const buyer = await db.buyer.upsert({
    where: { email: input.buyerEmail.toLowerCase() },
    update: {
      displayName: input.buyerDisplayName ?? undefined,
    },
    create: {
      email: input.buyerEmail.toLowerCase(),
      displayName: input.buyerDisplayName,
    },
  });

  const unitPrice = BigInt(product.unitPrice);
  const totalAmount = unitPrice * BigInt(quantity);
  const paymentRequired = totalAmount > 0n;
  const token = paymentRequired ? await syncSupportedPaymentToken() : null;
  const receiverAddress = paymentRequired
    ? token!.receiverAddress
    : product.merchant.settlementAddress;

  const order = await db.order.create({
    data: {
      reference: `TIKO-${orderReference()}`,
      merchantId: product.merchantId,
      buyerId: buyer.id,
      productId: product.id,
      tierId: product.ticketTier?.id,
      quantity,
      unitPrice: unitPrice.toString(),
      totalAmount: totalAmount.toString(),
      paymentAmount: totalAmount.toString(),
      receiverAddress,
      network: toPrismaNetwork(env.CKB_NETWORK),
      ...(paymentRequired && token
        ? {
            paymentIntent: {
              create: {
                supportedPaymentTokenId: token.id,
                expectedAmount: totalAmount.toString(),
                xudtArgs: token.xudtArgs,
                receiverAddress: token.receiverAddress,
                confirmationsRequired: env.PAYMENT_CONFIRMATIONS_REQUIRED,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
              },
            },
          }
        : {}),
    },
  });

  if (!paymentRequired) {
    return fulfillFreeOrder(order.id);
  }

  return getOrderOrThrow(order.id);
}
