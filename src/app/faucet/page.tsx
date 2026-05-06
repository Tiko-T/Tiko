import { FaucetClaimForm } from "@/components/common/faucet-claim-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function FaucetPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <FaucetClaimForm />
      </main>
      <SiteFooter />
    </>
  );
}
