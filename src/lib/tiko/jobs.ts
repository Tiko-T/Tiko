import {
  BackgroundJobStatus,
  BackgroundJobType,
  PaymentIntentStatus,
} from "@prisma/client";

import { db } from "@/lib/db";

import { orderDetailInclude } from "./orders";
import { reconcileSubmittedPayment } from "./payments";
import { fulfillPaidOrder } from "./fulfillment";

const DEFAULT_JOB_LIMIT = 12;

function buildDedupeKey(type: BackgroundJobType, orderId: string) {
  return `${type}:${orderId}`;
}

function computeBackoffMs(attempts: number) {
  return Math.min(15 * 60 * 1000, Math.max(15_000, attempts * 30_000));
}

async function upsertOrderJob(type: BackgroundJobType, orderId: string) {
  return db.backgroundJob.upsert({
    where: {
      dedupeKey: buildDedupeKey(type, orderId),
    },
    update: {
      status: BackgroundJobStatus.PENDING,
      runAfter: new Date(),
      failureReason: null,
      lockedAt: null,
      completedAt: null,
      orderId,
    },
    create: {
      type,
      orderId,
      dedupeKey: buildDedupeKey(type, orderId),
      status: BackgroundJobStatus.PENDING,
      runAfter: new Date(),
    },
  });
}

export async function enqueuePaymentReconciliation(orderId: string) {
  return upsertOrderJob(BackgroundJobType.RECONCILE_PAYMENT, orderId);
}

export async function enqueueOrderFulfillment(orderId: string) {
  return upsertOrderJob(BackgroundJobType.FULFILL_ORDER, orderId);
}

export async function retryOrderJobs(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      paymentIntent: true,
      sporeAsset: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (
    order.paymentIntent?.submittedTxHash &&
    order.paymentIntent.status !== PaymentIntentStatus.CONFIRMED
  ) {
    await enqueuePaymentReconciliation(orderId);
  }

  if (
    order.paymentIntent?.status === PaymentIntentStatus.CONFIRMED &&
    order.status !== "FULFILLED"
  ) {
    await enqueueOrderFulfillment(orderId);
  }

  return orderId;
}

export async function listSupportOrders(limit = 40) {
  return db.order.findMany({
    include: {
      ...orderDetailInclude,
      jobs: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

async function markJobRunning(jobId: string) {
  return db.backgroundJob.updateMany({
    where: {
      id: jobId,
      status: {
        in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.FAILED],
      },
    },
    data: {
      status: BackgroundJobStatus.RUNNING,
      lockedAt: new Date(),
      attempts: {
        increment: 1,
      },
    },
  });
}

async function markJobCompleted(jobId: string) {
  await db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: BackgroundJobStatus.COMPLETED,
      completedAt: new Date(),
      lockedAt: null,
      failureReason: null,
    },
  });
}

async function markJobFailed(jobId: string, attempts: number, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  await db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: BackgroundJobStatus.FAILED,
      failureReason: message,
      lockedAt: null,
      runAfter: new Date(Date.now() + computeBackoffMs(attempts)),
    },
  });
}

async function runJob(job: {
  id: string;
  orderId: string | null;
  type: BackgroundJobType;
  attempts: number;
}) {
  if (!job.orderId) {
    throw new Error("Order-backed job is missing an order id");
  }

  if (job.type === BackgroundJobType.RECONCILE_PAYMENT) {
    const order = await reconcileSubmittedPayment(job.orderId);

    if (order.paymentIntent?.status === PaymentIntentStatus.CONFIRMED) {
      await enqueueOrderFulfillment(job.orderId);
    }

    return;
  }

  await fulfillPaidOrder(job.orderId);
}

export async function processPendingJobs(limit = DEFAULT_JOB_LIMIT) {
  const jobs = await db.backgroundJob.findMany({
    where: {
      status: {
        in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.FAILED],
      },
      runAfter: {
        lte: new Date(),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  const summary = {
    processed: 0,
    completed: 0,
    failed: 0,
  };

  for (const job of jobs) {
    const claimed = await markJobRunning(job.id);

    if (claimed.count === 0) {
      continue;
    }

    summary.processed += 1;

    try {
      await runJob(job);
      await markJobCompleted(job.id);
      summary.completed += 1;
    } catch (error) {
      await markJobFailed(job.id, job.attempts + 1, error);
      summary.failed += 1;
    }
  }

  return summary;
}
