import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { acceptInvite } from "@/lib/auth/session";

export const runtime = "nodejs";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  displayName: z.string().min(1).optional(),
  password: z.string().min(12),
});

export async function POST(request: Request) {
  try {
    const payload = acceptInviteSchema.parse(await request.json());
    const user = await acceptInvite(payload);
    return ok({
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
