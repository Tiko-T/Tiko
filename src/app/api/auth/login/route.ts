import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { signInWithPassword } from "@/lib/auth/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  nextPath: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    await signInWithPassword(payload.email, payload.password);
    return ok({
      redirectTo: payload.nextPath || "/",
    });
  } catch (error) {
    return fail(error);
  }
}
