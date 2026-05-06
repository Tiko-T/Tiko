DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'FaucetClaimStatus'
  ) THEN
    CREATE TYPE "FaucetClaimStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "FaucetClaim" (
  "id" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "network" "ChainNetwork" NOT NULL,
  "amount" TEXT NOT NULL,
  "txHash" TEXT,
  "status" "FaucetClaimStatus" NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaucetClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FaucetClaim_walletAddress_network_idx"
  ON "FaucetClaim"("walletAddress", "network");

CREATE INDEX IF NOT EXISTS "FaucetClaim_status_requestedAt_idx"
  ON "FaucetClaim"("status", "requestedAt");
