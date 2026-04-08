import { ProductKind } from "@prisma/client";

import { db } from "@/lib/db";
import { toPrismaNetwork } from "@/lib/env";
import { getActiveTokenConfig } from "@/lib/ckb/wallets";

const TIKO_MERCHANT_SLUG = "tiko";
const TIKO_EVENT_SLUG = "global-creator-summit-2026";
const TIKO_PRODUCT_SLUG = "global-access-pass";

export async function syncSupportedPaymentToken() {
  const tokenConfig = await getActiveTokenConfig();

  return db.supportedPaymentToken.upsert({
    where: {
      network_xudtArgs: {
        network: toPrismaNetwork(tokenConfig.network),
        xudtArgs: tokenConfig.xudtArgs,
      },
    },
    update: {
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      issuerAddress: tokenConfig.issuerAddress,
      receiverAddress: tokenConfig.receiverAddress,
      isActive: true,
    },
    create: {
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      network: toPrismaNetwork(tokenConfig.network),
      xudtArgs: tokenConfig.xudtArgs,
      issuerAddress: tokenConfig.issuerAddress,
      receiverAddress: tokenConfig.receiverAddress,
      isActive: true,
    },
  });
}

export async function seedCatalog() {
  const paymentToken = await syncSupportedPaymentToken();

  const merchant = await db.merchant.upsert({
    where: { slug: TIKO_MERCHANT_SLUG },
    update: {
      name: "Tiko",
      settlementAddress: paymentToken.receiverAddress,
    },
    create: {
      slug: TIKO_MERCHANT_SLUG,
      name: "Tiko",
      settlementAddress: paymentToken.receiverAddress,
    },
  });

  const event = await db.event.upsert({
    where: { slug: TIKO_EVENT_SLUG },
    update: {
      merchantId: merchant.id,
      title: "Tiko Global Creator Summit 2026",
      venue: "Hybrid / Global",
      startsAt: new Date("2026-07-18T09:00:00.000Z"),
      endsAt: new Date("2026-07-18T18:00:00.000Z"),
    },
    create: {
      merchantId: merchant.id,
      slug: TIKO_EVENT_SLUG,
      title: "Tiko Global Creator Summit 2026",
      venue: "Hybrid / Global",
      startsAt: new Date("2026-07-18T09:00:00.000Z"),
      endsAt: new Date("2026-07-18T18:00:00.000Z"),
    },
  });

  const product = await db.product.upsert({
    where: { slug: TIKO_PRODUCT_SLUG },
    update: {
      merchantId: merchant.id,
      eventId: event.id,
      title: "Global Access Pass",
      description:
        "Join the summit with one access pass for sessions, talks, and event-day entry, with your ticket unlocking after payment confirmation.",
      kind: ProductKind.TICKET,
      unitPrice: "2500",
      inventory: 250,
    },
    create: {
      merchantId: merchant.id,
      eventId: event.id,
      slug: TIKO_PRODUCT_SLUG,
      title: "Global Access Pass",
      description:
        "Join the summit with one access pass for sessions, talks, and event-day entry, with your ticket unlocking after payment confirmation.",
      kind: ProductKind.TICKET,
      unitPrice: "2500",
      inventory: 250,
    },
  });

  const tier = await db.ticketTier.upsert({
    where: { productId: product.id },
    update: {
      eventId: event.id,
      name: "General Admission",
      supply: 250,
    },
    create: {
      eventId: event.id,
      productId: product.id,
      name: "General Admission",
      supply: 250,
    },
  });

  return {
    merchant,
    event,
    product,
    tier,
    paymentToken,
  };
}

export async function ensureSeedBuyer(email = "buyer@tiko.local") {
  return db.buyer.upsert({
    where: { email },
    update: {
      displayName: "Tiko Test Buyer",
    },
    create: {
      email,
      displayName: "Tiko Test Buyer",
    },
  });
}

export async function listCatalog() {
  return db.product.findMany({
    include: {
      merchant: true,
      event: true,
      ticketTier: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
