import { fail, ok } from "@/lib/api/responses";
import { requireApiAdminUser } from "@/lib/auth/api-guards";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireApiAdminUser();

    if (env.CKB_NETWORK !== "devnet") {
      throw new Error("Bootstrap is disabled outside devnet");
    }

    const { bootstrapDevnet } = await import("@/lib/tiko/bootstrap");
    return ok(await bootstrapDevnet());
  } catch (error) {
    return fail(error);
  }
}
