import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { env } from "@/lib/env";
import { formatTokenAmount } from "@/lib/frontend/format";
import { claimFaucetTokens } from "@/lib/tiko/faucet";

export const runtime = "nodejs";

const claimSchema = z.object({
  walletAddress: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = claimSchema.parse(await request.json());
    const result = await claimFaucetTokens(payload.walletAddress);

    return ok({
      walletAddress: payload.walletAddress.trim(),
      claimAmountDisplay: formatTokenAmount(
        result.claimAmount,
        env.CKB_TOKEN_DECIMALS,
        env.PRICE_DISPLAY_SYMBOL
      ),
      maxPerWalletDisplay: `${env.FAUCET_MAX_PER_WALLET} ${env.PRICE_DISPLAY_SYMBOL}`,
      remainingAmountDisplay: formatTokenAmount(
        result.remainingAmount,
        env.CKB_TOKEN_DECIMALS,
        env.PRICE_DISPLAY_SYMBOL
      ),
      txHash: result.txHash,
    });
  } catch (error) {
    return fail(error);
  }
}
