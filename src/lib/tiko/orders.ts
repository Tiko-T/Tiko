import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const orderDetailInclude = {
  buyer: true,
  merchant: true,
  tier: true,
  product: {
    include: {
      event: true,
      ticketTier: true,
    },
  },
  paymentIntent: {
    include: {
      token: true,
    },
  },
  entitlement: true,
  sporeAsset: true,
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;

export async function getOrderById(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: orderDetailInclude,
  });
}

export async function getOrderOrThrow(orderId: string) {
  const order = await getOrderById(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} was not found`);
  }

  return order;
}
