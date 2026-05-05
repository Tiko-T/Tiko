import { fail, ok } from "@/lib/api/responses";
import { requireApiAdminUser } from "@/lib/auth/api-guards";
import { retryOrderJobs } from "@/lib/tiko/jobs";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireApiAdminUser();
    const { orderId } = await params;
    await retryOrderJobs(orderId);
    return ok({ orderId });
  } catch (error) {
    return fail(error);
  }
}
