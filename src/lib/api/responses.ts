import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown, status?: number) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const resolvedStatus =
    status ??
    (/(not found)/i.test(message)
      ? 404
      : /(sold out|already|missing|required|supports quantity=1 only)/i.test(message)
      ? 409
      : 400);

  return NextResponse.json(
    {
      error: {
        message,
      },
    },
    { status: resolvedStatus }
  );
}
