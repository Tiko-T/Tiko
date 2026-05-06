import {
  catalogProductViewSchema,
  checkInResultViewSchema,
  faucetViewSchema,
  orderViewSchema,
  type CatalogProductView,
  type CheckInResultView,
  type FaucetView,
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
  const hasFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(input, {
    ...init,
    headers: hasFormDataBody
      ? init?.headers
      : {
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
    pricingMode: "paid" | "free";
    eventImageFile?: File | null;
    ticketTitle: string;
    ticketTierName: string;
    description: string;
    ticketPrice?: string;
    capacity: number;
  }) {
    const body = new FormData();
    body.set("organizerName", payload.organizerName);
    body.set("eventTitle", payload.eventTitle);
    body.set("venue", payload.venue);
    body.set("startsAtIso", payload.startsAtIso);
    body.set("endsAtIso", payload.endsAtIso);
    body.set("pricingMode", payload.pricingMode);
    body.set("ticketTitle", payload.ticketTitle);
    body.set("ticketTierName", payload.ticketTierName);
    body.set("description", payload.description);
    body.set("ticketPrice", payload.ticketPrice ?? "");
    body.set("capacity", String(payload.capacity));

    if (payload.eventImageFile) {
      body.set("eventImage", payload.eventImageFile);
    }

    return requestData("/api/listings", catalogProductViewSchema, {
      method: "POST",
      body,
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
  claimFaucet(walletAddress: string) {
    return requestData("/api/faucet", faucetViewSchema, {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
      }),
    }) as Promise<FaucetView>;
  },
};
