import { fail, ok } from "@/lib/api/responses";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { bootstrapDevnet } = await import("@/lib/tiko/bootstrap");
    return ok(await bootstrapDevnet());
  } catch (error) {
    return fail(error);
  }
}
