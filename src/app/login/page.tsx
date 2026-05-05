import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);

  if (currentUser) {
    redirect(next || "/");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <SignInForm nextPath={next || "/"} />
      </main>
      <SiteFooter />
    </>
  );
}
