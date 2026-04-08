import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";

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
    const { orderId } = await params;
    const payload = submitPaymentSchema.parse(await request.json());
    const [{ registerPaymentSubmission, submitAndReconcilePayment }, { toOrderView }] =
      await Promise.all([
        import("@/lib/tiko/payments"),
        import("@/lib/frontend/server-data"),
      ]);

    if (payload.reconcile === false) {
      const order = await registerPaymentSubmission(orderId, payload.txHash);
      return ok(toOrderView(order));
    }

    const order = await submitAndReconcilePayment(orderId, payload.txHash);
    return ok(toOrderView(order));
  } catch (error) {
    return fail(error);
  }
}
