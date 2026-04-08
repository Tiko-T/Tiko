import { ok } from "@/lib/api/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [{ cccClient }, { db }] = await Promise.all([
    import("@/lib/ckb/ccc-client"),
    import("@/lib/db"),
  ]);

  const [tip, productCount] = await Promise.all([
    cccClient.getTip(),
    db.product.count(),
  ]);

  return ok({
    chainTip: tip.toString(),
    productCount,
  });
}
