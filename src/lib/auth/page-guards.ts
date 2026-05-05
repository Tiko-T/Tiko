import { redirect } from "next/navigation";

import {
  getCurrentUser,
  isAdminUser,
  isStaffUser,
  type AuthenticatedUser,
} from "./session";

function buildLoginHref(nextPath: string) {
  const searchParams = new URLSearchParams({
    next: nextPath,
  });

  return `/login?${searchParams.toString()}`;
}

export async function requireSignedInUser(nextPath: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginHref(nextPath));
  }

  return user;
}

export async function requireStaffUser(nextPath: string): Promise<AuthenticatedUser> {
  const user = await requireSignedInUser(nextPath);

  if (!isStaffUser(user)) {
    redirect("/");
  }

  return user;
}

export async function requireAdminUser(nextPath: string): Promise<AuthenticatedUser> {
  const user = await requireSignedInUser(nextPath);

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return user;
}
