import { fail, ok } from "@/lib/api/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { getOrderViewById } = await import("@/lib/frontend/server-data");
    const order = await getOrderViewById(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} was not found`);
    }

    return ok(order);
  } catch (error) {
    return fail(error);
  }
}
