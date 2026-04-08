import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  buyerEmail: z.string().email(),
  buyerDisplayName: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  productSlug: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = checkoutSchema.parse(await request.json());
    const [{ createCheckoutOrder }, { toOrderView }] = await Promise.all([
      import("@/lib/tiko/checkout"),
      import("@/lib/frontend/server-data"),
    ]);
    const order = await createCheckoutOrder(payload);
    return ok(toOrderView(order), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
