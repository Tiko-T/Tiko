import { OrderStatus, SporeMintStatus } from "@prisma/client";
import { customAlphabet } from "nanoid";

import { db } from "@/lib/db";
import { env, toPrismaNetwork } from "@/lib/env";
import { mintTicketSpore } from "@/lib/ckb/spore";

import { getOrderOrThrow } from "./orders";

const accessCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 16);

export async function fulfillPaidOrder(orderId: string) {
  const order = await getOrderOrThrow(orderId);

  if (order.status === OrderStatus.FULFILLED) {
    return order;
  }

  if (order.status !== OrderStatus.PAID) {
    throw new Error(`Order ${order.reference} is not ready for fulfillment`);
  }

  if (!order.payerAddress) {
    throw new Error(`Order ${order.reference} does not have a resolved payer address`);
  }

  if (!order.product.event || !order.product.ticketTier) {
    throw new Error(`Order ${order.reference} is missing ticketing metadata`);
  }

  const accessCode = accessCodeAlphabet();

  const entitlement =
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
        chainOwnerAddress: order.payerAddress,
      },
    }));

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
    event: order.product.event.title,
    eventSlug: order.product.event.slug,
    accessCode: entitlement.accessCode,
    ownerAddress: order.payerAddress,
    issuedAt: new Date().toISOString(),
  });

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

  await db.$transaction([
    db.ticketTier.update({
      where: { id: order.product.ticketTier.id },
      data: {
        sold: {
          increment: 1,
        },
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.FULFILLED,
      },
    }),
  ]);

  return getOrderOrThrow(orderId);
}
