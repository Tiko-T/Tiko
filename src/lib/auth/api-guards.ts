import { forbidden, unauthorized } from "@/lib/api/responses";

import {
  getCurrentUser,
  isAdminUser,
  isStaffUser,
  type AuthenticatedUser,
} from "./session";

export async function requireApiUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthorized();
  }

  return user;
}

export async function requireApiStaffUser() {
  const user = await requireApiUser();

  if (!isStaffUser(user)) {
    throw forbidden();
  }

  return user;
}

export async function requireApiAdminUser() {
  const user = await requireApiUser();

  if (!isAdminUser(user)) {
    throw forbidden();
  }

  return user;
}
