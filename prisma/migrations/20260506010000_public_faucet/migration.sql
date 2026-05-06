-- CreateEnum
CREATE TYPE "FaucetClaimStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "FaucetClaim" (
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

-- CreateIndex
CREATE INDEX "FaucetClaim_walletAddress_network_idx" ON "FaucetClaim"("walletAddress", "network");

-- CreateIndex
CREATE INDEX "FaucetClaim_status_requestedAt_idx" ON "FaucetClaim"("status", "requestedAt");
