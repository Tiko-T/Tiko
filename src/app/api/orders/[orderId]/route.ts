import { fail, ok } from "@/lib/api/responses";
import { requireApiUser } from "@/lib/auth/api-guards";
import { canAccessOrder, isStaffUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const currentUser = await requireApiUser();
    const { orderId } = await params;
    const [{ getOrderViewById }, { processPendingJobs }] = await Promise.all([
      import("@/lib/frontend/server-data"),
      import("@/lib/tiko/jobs"),
    ]);

    if (process.env.NODE_ENV === "development") {
      await processPendingJobs(4);
    }

    const order = await getOrderViewById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} was not found`);
    }

    if (!canAccessOrder(currentUser, order.buyer.email) && !isStaffUser(currentUser)) {
      throw new Error(`Order ${orderId} was not found`);
    }

    return ok(order);
  } catch (error) {
    return fail(error);
  }
}
