import { bootstrapDevnet } from "../src/lib/tiko/bootstrap";

async function main() {
  const summary = await bootstrapDevnet();
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
