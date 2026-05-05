import { fail, ok, unauthorized } from "@/lib/api/responses";
import { env } from "@/lib/env";
import { processPendingJobs } from "@/lib/tiko/jobs";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  return bearerToken === env.CRON_SECRET || querySecret === env.CRON_SECRET;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      throw unauthorized("Invalid cron secret");
    }

    const result = await processPendingJobs();
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
