import { notFound, redirect } from "next/navigation";

import { OrderExperience } from "@/components/buyer/order-experience";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { canAccessOrder, getCurrentUser } from "@/lib/auth/session";
import { getOrderViewById } from "@/lib/frontend/server-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, currentUser] = await Promise.all([params, getCurrentUser()]);

  if (!currentUser) {
    redirect(`/login?next=${encodeURIComponent(`/orders/${orderId}`)}`);
  }

  const order = await getOrderViewById(orderId);

  if (!order) {
    notFound();
  }

  if (!canAccessOrder(currentUser, order.buyer.email)) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
        <OrderExperience initialOrder={order} />
      </main>
      <SiteFooter />
    </>
  );
}
