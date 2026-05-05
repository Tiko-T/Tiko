import "dotenv/config";

import { db } from "../src/lib/db";
import { env } from "../src/lib/env";
import { submitBuyerTestPayment } from "../src/lib/ckb/payments";

type LoginResponse = {
  data: {
    redirectTo: string;
  };
};

type OrderResponse = {
  data: {
    id: string;
    reference: string;
    stage: string;
    buyer: {
      email: string;
    };
    pricing: {
      paymentAmount: string;
    };
    payment: {
      submittedTxHash: string | null;
      confirmedTxHash: string | null;
    };
    receiverAddress: string;
  };
};

function getBaseUrl() {
  const url = new URL(env.APP_URL);

  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }

  return url.origin;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json()) as T | { error?: { message?: string } };

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      payload.error?.message
        ? payload.error.message
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return {
    response,
    payload: payload as T,
  };
}

async function wait(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  if (!env.BETA_ADMIN_EMAIL || !env.BETA_ADMIN_PASSWORD) {
    throw new Error("BETA_ADMIN_EMAIL and BETA_ADMIN_PASSWORD are required");
  }

  const baseUrl = getBaseUrl();

  const login = await requestJson<LoginResponse>(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: env.BETA_ADMIN_EMAIL,
      password: env.BETA_ADMIN_PASSWORD,
      nextPath: "/",
    }),
  });

  const cookie = login.response.headers.get("set-cookie");

  if (!cookie) {
    throw new Error("Login did not return a session cookie");
  }

  const checkout = await requestJson<OrderResponse>(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      buyerEmail: env.BETA_ADMIN_EMAIL,
      productSlug: "global-access-pass",
    }),
  });

  const createdOrder = checkout.payload.data;

  const payment = await submitBuyerTestPayment(
    createdOrder.receiverAddress,
    BigInt(createdOrder.pricing.paymentAmount),
    env.CKB_XUDT_ARGS
  );

  await requestJson<OrderResponse>(
    `${baseUrl}/api/orders/${createdOrder.id}/submit-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        txHash: payment.txHash,
      }),
    }
  );

  let latest: OrderResponse["data"] = createdOrder;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    await requestJson(`${baseUrl}/api/cron/process-jobs?secret=${env.CRON_SECRET}`);
    await wait(5_000);

    const order = await requestJson<OrderResponse>(`${baseUrl}/api/orders/${createdOrder.id}`, {
      headers: {
        Cookie: cookie,
      },
    });
    latest = order.payload.data;

    if (latest.stage === "ticket_ready") {
      break;
    }
  }

  const storedOrder = await db.order.findUnique({
    where: { id: createdOrder.id },
    include: {
      paymentIntent: true,
      sporeAsset: true,
      entitlement: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        baseUrl,
        orderId: createdOrder.id,
        orderReference: latest.reference,
        orderStage: latest.stage,
        buyerEmail: latest.buyer.email,
        paymentTxHash: payment.txHash,
        confirmedTxHash: storedOrder?.paymentIntent?.confirmedTxHash ?? null,
        paymentStatus: storedOrder?.paymentIntent?.status ?? null,
        orderStatus: storedOrder?.status ?? null,
        sporeMintStatus: storedOrder?.sporeAsset?.mintStatus ?? null,
        sporeMintTxHash: storedOrder?.sporeAsset?.mintTxHash ?? null,
        accessCode: storedOrder?.entitlement?.accessCode ?? null,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
