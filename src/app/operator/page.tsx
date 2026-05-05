import { OperatorConsole } from "@/components/operator/operator-console";
import { SiteHeader } from "@/components/layout/site-header";
import { requireStaffUser } from "@/lib/auth/page-guards";

export const runtime = "nodejs";

export default async function OperatorPage() {
  await requireStaffUser("/operator");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <OperatorConsole />
      </main>
    </>
  );
}
