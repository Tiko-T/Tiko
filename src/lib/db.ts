import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

declare global {
  var __tikoPrisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const db =
  global.__tikoPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__tikoPrisma = db;
}
