import { readFile } from "node:fs/promises";
import path from "node:path";

import { fail } from "@/lib/api/responses";
import { getEventImageContentType } from "@/lib/tiko/event-images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveEventImagePath(fileName: string) {
  const safeFileName = path.basename(fileName);

  if (!safeFileName || safeFileName !== fileName) {
    throw new Error("Invalid event image path.");
  }

  return path.join(process.cwd(), "public", "uploads", "events", safeFileName);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    const filePath = resolveEventImagePath(fileName);
    const bytes = new Uint8Array(await readFile(filePath));
    const contentType = getEventImageContentType(bytes);

    if (!contentType) {
      throw new Error("Uploaded event image format is not supported.");
    }

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    if (
      /ENOENT/.test(message) ||
      /Invalid event image path/i.test(message) ||
      /not supported/i.test(message)
    ) {
      return new Response("Not found", { status: 404 });
    }

    return fail(error, 500);
  }
}
