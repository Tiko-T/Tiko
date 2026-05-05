import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { requireApiStaffUser } from "@/lib/auth/api-guards";
import { toCatalogProductView } from "@/lib/frontend/server-data";
import { createEventListing } from "@/lib/tiko/listings";
import { saveUploadedEventImage } from "@/lib/tiko/event-images";

export const runtime = "nodejs";

const createEventListingSchema = z.object({
  organizerName: z.string().min(2),
  eventTitle: z.string().min(3),
  venue: z.string().min(2),
  startsAtIso: z.string().min(1),
  endsAtIso: z.string().min(1),
  pricingMode: z.enum(["paid", "free"]),
  ticketTitle: z.string().min(3),
  ticketTierName: z.string().min(2),
  description: z.string().min(20),
  ticketPrice: z.string().optional().default(""),
  capacity: z.coerce.number().int().min(1).max(100000),
}).superRefine((payload, ctx) => {
  if (payload.pricingMode === "paid" && !payload.ticketPrice.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ticket price is required for paid events.",
      path: ["ticketPrice"],
    });
  }
});

async function parseCreateEventListingRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return {
      payload: createEventListingSchema.parse(await request.json()),
      imageFile: null,
    };
  }

  const formData = await request.formData();
  const payload = createEventListingSchema.parse({
    organizerName: formData.get("organizerName"),
    eventTitle: formData.get("eventTitle"),
    venue: formData.get("venue"),
    startsAtIso: formData.get("startsAtIso"),
    endsAtIso: formData.get("endsAtIso"),
    pricingMode: formData.get("pricingMode"),
    ticketTitle: formData.get("ticketTitle"),
    ticketTierName: formData.get("ticketTierName"),
    description: formData.get("description"),
    ticketPrice: formData.get("ticketPrice"),
    capacity: formData.get("capacity"),
  });

  const imageEntry = formData.get("eventImage");

  if (imageEntry !== null && !(imageEntry instanceof File)) {
    throw new Error("Event image upload is invalid.");
  }

  return {
    payload,
    imageFile: imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null,
  };
}

export async function POST(request: Request) {
  try {
    await requireApiStaffUser();
    const { payload, imageFile } = await parseCreateEventListingRequest(request);
    const eventImageSrc = imageFile
      ? await saveUploadedEventImage({
          eventTitle: payload.eventTitle,
          file: imageFile,
        })
      : null;
    const product = await createEventListing({
      ...payload,
      eventImageSrc,
    });
    return ok(toCatalogProductView(product));
  } catch (error) {
    return fail(error);
  }
}
