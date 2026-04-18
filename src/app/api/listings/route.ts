import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { toCatalogProductView } from "@/lib/frontend/server-data";
import { createEventListing } from "@/lib/tiko/listings";

export const runtime = "nodejs";

const createEventListingSchema = z.object({
  organizerName: z.string().min(2),
  eventTitle: z.string().min(3),
  venue: z.string().min(2),
  startsAtIso: z.string().min(1),
  endsAtIso: z.string().min(1),
  ticketTitle: z.string().min(3),
  ticketTierName: z.string().min(2),
  description: z.string().min(20),
  ticketPrice: z.string().min(1),
  capacity: z.coerce.number().int().min(1).max(100000),
});

export async function POST(request: Request) {
  try {
    const payload = createEventListingSchema.parse(await request.json());
    const product = await createEventListing(payload);
    return ok(toCatalogProductView(product));
  } catch (error) {
    return fail(error);
  }
}
