import { OrderStatus, PaymentIntentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { verifySubmittedPayment } from "@/lib/ckb/payments";

import { getOrderOrThrow } from "./orders";

export async function registerPaymentSubmission(orderId: string, txHash: string) {
  const order = await getOrderOrThrow(orderId);

  if (!order.paymentIntent) {
    throw new Error(`Order ${order.reference} does not have a payment intent`);
  }

  if (order.paymentIntent.status === PaymentIntentStatus.CONFIRMED) {
    return order;
  }

  await db.$transaction([
    db.paymentIntent.update({
      where: { orderId },
      data: {
        status: PaymentIntentStatus.SUBMITTED,
        submittedTxHash: txHash,
        submittedAt: new Date(),
        lastCheckedAt: new Date(),
      },
    }),
    db.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAYMENT_SUBMITTED,
      },
    }),
  ]);

  return getOrderOrThrow(orderId);
}

export async function reconcileSubmittedPayment(orderId: string) {
  const order = await getOrderOrThrow(orderId);

  if (!order.paymentIntent) {
    throw new Error(`Order ${order.reference} does not have a payment intent`);
  }

  if (order.status === OrderStatus.FULFILLED) {
    return order;
  }

  if (order.paymentIntent.status === PaymentIntentStatus.CONFIRMED) {
    return getOrderOrThrow(orderId);
  }

  if (!order.paymentIntent?.submittedTxHash) {
    throw new Error(`Order ${order.reference} does not have a submitted transaction yet`);
  }

  try {
    const verified = await verifySubmittedPayment({
      txHash: order.paymentIntent.submittedTxHash,
      receiverAddress: order.paymentIntent.receiverAddress,
      expectedAmount: BigInt(order.paymentIntent.expectedAmount),
      xudtArgs: order.paymentIntent.xudtArgs,
      confirmationsRequired: order.paymentIntent.confirmationsRequired,
    });

    await db.$transaction([
      db.paymentIntent.update({
        where: { orderId },
        data: {
          status: PaymentIntentStatus.CONFIRMED,
          confirmedTxHash: verified.txHash,
          confirmedAt: new Date(),
          lastCheckedAt: new Date(),
          payerAddress: verified.payerAddress,
          failureReason: null,
        },
      }),
      db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          payerAddress: verified.payerAddress,
        },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const looksTransient =
      /timeout|pending|proposed|not found/i.test(message);

    await db.paymentIntent.update({
      where: { orderId },
      data: {
        status: looksTransient
          ? PaymentIntentStatus.CONFIRMING
          : PaymentIntentStatus.FAILED,
        failureReason: message,
        lastCheckedAt: new Date(),
      },
    });

    if (!looksTransient) {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FAILED,
        },
      });
    }

    throw error;
  }

  return getOrderOrThrow(orderId);
}

export async function submitAndReconcilePayment(orderId: string, txHash: string) {
  await registerPaymentSubmission(orderId, txHash);
  return reconcileSubmittedPayment(orderId);
}
