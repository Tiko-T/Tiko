import { OperatorConsole } from "@/components/operator/operator-console";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const runtime = "nodejs";

export default function OperatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <OperatorConsole />
      </main>
      <SiteFooter />
    </>
  );
}
