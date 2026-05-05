import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { requireApiUser } from "@/lib/auth/api-guards";
import { canAccessOrder } from "@/lib/auth/session";

export const runtime = "nodejs";

const submitPaymentSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]+$/),
  reconcile: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const currentUser = await requireApiUser();
    const { orderId } = await params;
    const payload = submitPaymentSchema.parse(await request.json());
    const [
      { registerPaymentSubmission },
      { enqueuePaymentReconciliation, processPendingJobs },
      { getOrderOrThrow },
      { toOrderView },
    ] =
      await Promise.all([
        import("@/lib/tiko/payments"),
        import("@/lib/tiko/jobs"),
        import("@/lib/tiko/orders"),
        import("@/lib/frontend/server-data"),
      ]);

    const existingOrder = await getOrderOrThrow(orderId);

    if (!canAccessOrder(currentUser, existingOrder.buyer.email)) {
      throw new Error(`Order ${orderId} was not found`);
    }

    const order = await registerPaymentSubmission(orderId, payload.txHash);

    if (payload.reconcile !== false) {
      await enqueuePaymentReconciliation(orderId);

      if (process.env.NODE_ENV === "development") {
        await processPendingJobs(2);
      }
    }

    return ok(toOrderView(order));
  } catch (error) {
    return fail(error);
  }
}
