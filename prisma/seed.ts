import "dotenv/config";

import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

import { db } from "../src/lib/db";
import { env } from "../src/lib/env";
import { ensureSeedBuyer, seedCatalog } from "../src/lib/tiko/setup";

async function ensureSeedAdmin() {
  if (!env.BETA_ADMIN_EMAIL || !env.BETA_ADMIN_PASSWORD) {
    return null;
  }

  return db.user.upsert({
    where: {
      email: env.BETA_ADMIN_EMAIL.toLowerCase(),
    },
    update: {
      displayName: env.BETA_ADMIN_NAME ?? "Tiko Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: await bcrypt.hash(env.BETA_ADMIN_PASSWORD, 12),
      inviteAcceptedAt: new Date(),
    },
    create: {
      email: env.BETA_ADMIN_EMAIL.toLowerCase(),
      displayName: env.BETA_ADMIN_NAME ?? "Tiko Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: await bcrypt.hash(env.BETA_ADMIN_PASSWORD, 12),
      inviteAcceptedAt: new Date(),
    },
  });
}

async function main() {
  const catalog = await seedCatalog();
  const buyer = await ensureSeedBuyer();
  const admin = await ensureSeedAdmin();

  console.log(
    JSON.stringify(
      {
        merchant: catalog.merchant.slug,
        event: catalog.event.slug,
        product: catalog.product.slug,
        buyer: buyer.email,
        paymentToken: catalog.paymentToken.symbol,
        admin: admin?.email ?? null,
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
