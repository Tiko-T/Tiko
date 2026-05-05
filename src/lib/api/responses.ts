import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function unauthorized(message = "You need to sign in first") {
  return new ApiError(message, 401);
}

export function forbidden(message = "You do not have access to this resource") {
  return new ApiError(message, 403);
}

function withDevelopmentHint(message: string) {
  if (
    process.env.NODE_ENV === "development" &&
    /Unknown argument `[^`]+`/.test(message)
  ) {
    return `${message} The running dev server is likely using a stale Prisma client. Stop the current \`npm run dev\` process, start it again, and retry the request.`;
  }

  return message;
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown, status?: number) {
  const message = withDevelopmentHint(
    error instanceof Error ? error.message : "Unexpected error"
  );
  const resolvedStatus =
    status ??
    (error instanceof ApiError
      ? error.status
      : undefined) ??
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
