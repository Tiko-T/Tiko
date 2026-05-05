import { ok } from "@/lib/api/responses";
import { destroyCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  await destroyCurrentSession();
  return ok({ signedOut: true });
}
