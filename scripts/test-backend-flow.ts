import { db } from "../src/lib/db";
import { submitBuyerTestPayment } from "../src/lib/ckb/payments";
import { bootstrapDevnet } from "../src/lib/tiko/bootstrap";
import { checkInTicket } from "../src/lib/tiko/checkin";
import { createCheckoutOrder } from "../src/lib/tiko/checkout";
import { getOrderOrThrow } from "../src/lib/tiko/orders";
import { submitAndReconcilePayment } from "../src/lib/tiko/payments";
import { ensureSeedBuyer, seedCatalog } from "../src/lib/tiko/setup";

async function main() {
  await seedCatalog();
  await bootstrapDevnet();

  const buyerEmail = `buyer+${Date.now()}@tiko.local`;
  await ensureSeedBuyer(buyerEmail);

  const order = await createCheckoutOrder({
    buyerEmail,
    buyerDisplayName: "Tiko CLI Buyer",
    productSlug: "global-access-pass",
  });

  if (!order.paymentIntent) {
    throw new Error("Order was created without a payment intent");
  }

  const payment = await submitBuyerTestPayment(
    order.paymentIntent.receiverAddress,
    BigInt(order.paymentIntent.expectedAmount),
    order.paymentIntent.xudtArgs
  );

  const fulfilledOrder = await submitAndReconcilePayment(order.id, payment.txHash);
  const latest = await getOrderOrThrow(fulfilledOrder.id);

  const checkIn =
    latest.entitlement?.accessCode
      ? await checkInTicket(latest.entitlement.accessCode)
      : null;

  console.log(
    JSON.stringify(
      {
        orderReference: latest.reference,
        orderStatus: latest.status,
        paymentStatus: latest.paymentIntent?.status,
        paymentTxHash: latest.paymentIntent?.confirmedTxHash,
        payerAddress: latest.payerAddress,
        sporeMintStatus: latest.sporeAsset?.mintStatus,
        sporeMintTxHash: latest.sporeAsset?.mintTxHash,
        entitlementAccessCode: latest.entitlement?.accessCode,
        checkInStatus: checkIn?.status,
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
