import { fail, ok } from "@/lib/api/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { getCatalogProducts } = await import("@/lib/frontend/server-data");
    return ok(await getCatalogProducts());
  } catch (error) {
    return fail(error, 500);
  }
}
