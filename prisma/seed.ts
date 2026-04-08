import { ensureSeedBuyer, seedCatalog } from "../src/lib/tiko/setup";

async function main() {
  const catalog = await seedCatalog();
  const buyer = await ensureSeedBuyer();

  console.log(
    JSON.stringify(
      {
        merchant: catalog.merchant.slug,
        event: catalog.event.slug,
        product: catalog.product.slug,
        buyer: buyer.email,
        paymentToken: catalog.paymentToken.symbol,
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
  });
