import { UserRole } from "@prisma/client";
import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { requireApiAdminUser } from "@/lib/auth/api-guards";
import { createInvite } from "@/lib/auth/session";

export const runtime = "nodejs";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([UserRole.TESTER, UserRole.OPERATOR]),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireApiAdminUser();
    const payload = createInviteSchema.parse(await request.json());
    const invite = await createInvite({
      ...payload,
      invitedById: currentUser.id,
    });

    return ok({
      inviteId: invite.invite.id,
      inviteUrl: invite.inviteUrl,
      expiresAt: invite.invite.expiresAt.toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
