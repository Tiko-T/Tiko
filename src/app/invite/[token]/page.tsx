import { redirect } from "next/navigation";

import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [currentUser, { token }] = await Promise.all([getCurrentUser(), params]);

  if (currentUser) {
    redirect("/");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <AcceptInviteForm token={token} />
      </main>
      <SiteFooter />
    </>
  );
}
