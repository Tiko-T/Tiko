import { OrderStatus, PaymentIntentStatus, SporeMintStatus } from "@prisma/client";
import { customAlphabet } from "nanoid";

import { db } from "@/lib/db";
import { env, toPrismaNetwork } from "@/lib/env";
import { mintTicketSpore } from "@/lib/ckb/spore";

import { getOrderOrThrow } from "./orders";

const accessCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 16);

function createAccessCode() {
  return accessCodeAlphabet();
}

async function createEntitlementForOrder(order: Awaited<ReturnType<typeof getOrderOrThrow>>, ownerReference: string) {
  if (!order.product.event || !order.product.ticketTier) {
    throw new Error(`Order ${order.reference} is missing ticketing metadata`);
  }

  const accessCode = createAccessCode();

  return (
    order.entitlement ??
    (await db.ticketEntitlement.create({
      data: {
        orderId: order.id,
        buyerId: order.buyerId,
        eventId: order.product.event.id,
        tierId: order.product.ticketTier.id,
        accessCode,
        qrPayload: JSON.stringify({
          reference: order.reference,
          accessCode,
        }),
        chainOwnerAddress: ownerReference,
      },
    }))
  );
}

async function finalizeFulfilledTicketOrder(order: Awaited<ReturnType<typeof getOrderOrThrow>>) {
  const ticketTier = order.product.ticketTier;

  if (!ticketTier) {
    throw new Error(`Order ${order.reference} is missing ticket tier data`);
  }

  await db.$transaction(async (tx) => {
    const updatedOrder = await tx.order.updateMany({
      where: {
        id: order.id,
        status: {
          not: OrderStatus.FULFILLED,
        },
      },
      data: {
        status: OrderStatus.FULFILLED,
      },
    });

    if (updatedOrder.count === 0) {
      return;
    }

    await tx.ticketTier.update({
      where: { id: ticketTier.id },
      data: {
        sold: {
          increment: 1,
        },
      },
    });
  });
}

export async function fulfillFreeOrder(orderId: string) {
  const order = await getOrderOrThrow(orderId);

  if (order.status === OrderStatus.FULFILLED) {
    return order;
  }

  if (order.paymentAmount !== "0") {
    throw new Error(`Order ${order.reference} still requires payment`);
  }

  await createEntitlementForOrder(order, `free:${order.buyerId}`);
  await finalizeFulfilledTicketOrder(order);

  return getOrderOrThrow(orderId);
}

export async function fulfillPaidOrder(orderId: string) {
  const order = await getOrderOrThrow(orderId);

  if (order.status === OrderStatus.FULFILLED) {
    return order;
  }

  if (
    order.status !== OrderStatus.PAID &&
    order.paymentIntent?.status !== PaymentIntentStatus.CONFIRMED
  ) {
    throw new Error(`Order ${order.reference} is not ready for fulfillment`);
  }

  if (!order.payerAddress) {
    throw new Error(`Order ${order.reference} does not have a resolved payer address`);
  }

  const entitlement = await createEntitlementForOrder(order, order.payerAddress);
  const event = order.product.event;

  if (!event) {
    throw new Error(`Order ${order.reference} is missing event metadata`);
  }

  await db.walletLink.upsert({
    where: {
      network_address: {
        network: toPrismaNetwork(env.CKB_NETWORK),
        address: order.payerAddress,
      },
    },
    update: {
      buyerId: order.buyerId,
      verifiedAt: new Date(),
    },
    create: {
      buyerId: order.buyerId,
      address: order.payerAddress,
      network: toPrismaNetwork(env.CKB_NETWORK),
      verifiedAt: new Date(),
    },
  });

  const contentJson = JSON.stringify({
    app: "Tiko",
    orderReference: order.reference,
    product: order.product.title,
    event: event.title,
    eventSlug: event.slug,
    accessCode: entitlement.accessCode,
    ownerAddress: order.payerAddress,
    issuedAt: new Date().toISOString(),
  });

  if (
    order.sporeAsset?.mintStatus === SporeMintStatus.MINTED ||
    order.sporeAsset?.mintStatus === SporeMintStatus.SIMULATED
  ) {
    await finalizeFulfilledTicketOrder(order);
    return getOrderOrThrow(orderId);
  }

  await db.sporeAsset.upsert({
    where: { orderId: order.id },
    update: {
      ownerAddress: order.payerAddress,
      contentType: "application/json",
      contentJson,
      mintStatus:
        env.SPORE_MINTING_MODE === "real"
          ? SporeMintStatus.PENDING
          : SporeMintStatus.SIMULATED,
      failureReason: null,
    },
    create: {
      orderId: order.id,
      ownerAddress: order.payerAddress,
      contentType: "application/json",
      contentJson,
      mintStatus:
        env.SPORE_MINTING_MODE === "real"
          ? SporeMintStatus.PENDING
          : SporeMintStatus.SIMULATED,
    },
  });

  if (env.SPORE_MINTING_MODE === "real") {
    try {
      const spore = await mintTicketSpore({
        ownerAddress: order.payerAddress,
        contentJson,
      });

      await db.sporeAsset.update({
        where: { orderId: order.id },
        data: {
          mintStatus: SporeMintStatus.MINTED,
          mintTxHash: spore.txHash,
          outputIndex: spore.outputIndex,
          sporeId: spore.sporeId,
          failureReason: null,
        },
      });
    } catch (error) {
      await db.sporeAsset.update({
        where: { orderId: order.id },
        data: {
          mintStatus: SporeMintStatus.FAILED,
          failureReason: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  } else {
    await db.sporeAsset.update({
      where: { orderId: order.id },
      data: {
        mintStatus: SporeMintStatus.SIMULATED,
        sporeId: `simulated-${order.reference.toLowerCase()}`,
      },
    });
  }

  await finalizeFulfilledTicketOrder(order);

  return getOrderOrThrow(orderId);
}
