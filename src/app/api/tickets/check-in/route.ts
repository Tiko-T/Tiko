import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";

export const runtime = "nodejs";

const checkInSchema = z.object({
  accessCode: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = checkInSchema.parse(await request.json());
    const [{ checkInTicket }, { toCheckInResultView }] = await Promise.all([
      import("@/lib/tiko/checkin"),
      import("@/lib/frontend/server-data"),
    ]);
    const result = await checkInTicket(payload.accessCode);
    return ok(toCheckInResultView(result));
  } catch (error) {
    return fail(error);
  }
}
