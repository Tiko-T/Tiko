import {
  catalogProductViewSchema,
  checkInResultViewSchema,
  orderViewSchema,
  type CatalogProductView,
  type CheckInResultView,
  type OrderView,
} from "./contracts";

const apiErrorSchema = {
  parse(payload: unknown) {
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message;
    }

    return "Unexpected API error";
  },
};

async function requestData<T>(
  input: RequestInfo | URL,
  schema: { parse: (payload: unknown) => T },
  init?: RequestInit
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(apiErrorSchema.parse(payload));
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Malformed API response");
  }

  return schema.parse(payload.data);
}

export const tikoApi = {
  listCatalog() {
    return requestData("/api/catalog", {
      parse(payload) {
        return catalogProductViewSchema.array().parse(payload);
      },
    }) as Promise<CatalogProductView[]>;
  },
  createEventListing(payload: {
    organizerName: string;
    eventTitle: string;
    venue: string;
    startsAtIso: string;
    endsAtIso: string;
    ticketTitle: string;
    ticketTierName: string;
    description: string;
    ticketPrice: string;
    capacity: number;
  }) {
    return requestData("/api/listings", catalogProductViewSchema, {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<CatalogProductView>;
  },
  createCheckoutOrder(payload: {
    buyerEmail: string;
    buyerDisplayName?: string;
    productSlug: string;
  }) {
    return requestData("/api/checkout", orderViewSchema, {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<OrderView>;
  },
  getOrder(orderId: string) {
    return requestData(`/api/orders/${orderId}`, orderViewSchema) as Promise<OrderView>;
  },
  submitPayment(orderId: string, txHash: string, reconcile = true) {
    return requestData(`/api/orders/${orderId}/submit-payment`, orderViewSchema, {
      method: "POST",
      body: JSON.stringify({
        txHash,
        reconcile,
      }),
    }) as Promise<OrderView>;
  },
  checkIn(accessCode: string) {
    return requestData("/api/tickets/check-in", checkInResultViewSchema, {
      method: "POST",
      body: JSON.stringify({
        accessCode,
      }),
    }) as Promise<CheckInResultView>;
  },
};
