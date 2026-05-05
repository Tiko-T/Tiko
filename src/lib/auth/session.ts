import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { UserRole, UserStatus, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

const AUTH_COOKIE_NAME = "tiko_session";

export type AuthenticatedUser = Pick<
  User,
  "id" | "email" | "displayName" | "role" | "status"
>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function compareInviteToken(candidate: string, storedHash: string) {
  const candidateHash = hashToken(candidate);
  return timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));
}

async function getCookieStore() {
  return cookies();
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await getCookieStore();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function createSessionForUser(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await db.authSession.create({
    data: {
      userId,
      tokenHash: hashToken(sessionToken),
      expiresAt,
      lastSeenAt: new Date(),
    },
  });

  await setSessionCookie(sessionToken, expiresAt);
}

export async function destroyCurrentSession() {
  const cookieStore = await getCookieStore();
  const rawToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (rawToken) {
    await db.authSession.deleteMany({
      where: {
        tokenHash: hashToken(rawToken),
      },
    });
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await getCookieStore();
  const rawToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await db.authSession.findUnique({
    where: {
      tokenHash: hashToken(rawToken),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.authSession.delete({
        where: { id: session.id },
      });
    }

    cookieStore.delete(AUTH_COOKIE_NAME);
    return null;
  }

  if (session.user.status !== UserStatus.ACTIVE) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
    status: session.user.status,
  };
}

export function isStaffUser(user: Pick<User, "role"> | null | undefined) {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
}

export function isAdminUser(user: Pick<User, "role"> | null | undefined) {
  return user?.role === UserRole.ADMIN;
}

export function canAccessOrder(
  user: Pick<User, "role" | "email"> | null | undefined,
  buyerEmail: string
) {
  if (!user) {
    return false;
  }

  if (isStaffUser(user)) {
    return true;
  }

  return normalizeEmail(user.email) === normalizeEmail(buyerEmail);
}

export async function signInWithPassword(email: string, password: string) {
  const user = await db.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  await createSessionForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  } satisfies AuthenticatedUser;
}

export async function createInvite(input: {
  email: string;
  role: UserRole;
  invitedById?: string;
}) {
  const email = normalizeEmail(input.email);
  const existingUser = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingUser?.status === UserStatus.ACTIVE) {
    throw new Error("An active account already exists for that email");
  }

  const rawToken = randomBytes(24).toString("base64url");

  const invite = await db.betaInvite.create({
    data: {
      email,
      role: input.role,
      tokenHash: hashToken(rawToken),
      invitedById: input.invitedById,
      expiresAt: new Date(
        Date.now() + env.BETA_INVITE_TTL_HOURS * 60 * 60 * 1000
      ),
    },
  });

  return {
    invite,
    inviteUrl: `${env.APP_URL}/invite/${rawToken}`,
  };
}

export async function listInvites() {
  return db.betaInvite.findMany({
    include: {
      invitedBy: {
        select: {
          email: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function acceptInvite(params: {
  token: string;
  password: string;
  displayName?: string;
}) {
  const invites = await db.betaInvite.findMany({
    where: {
      acceptedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  const invite = invites.find((candidate) =>
    compareInviteToken(params.token, candidate.tokenHash)
  );

  if (!invite) {
    throw new Error("Invite link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(params.password, 12);
  const user = await db.user.upsert({
    where: {
      email: invite.email,
    },
    update: {
      displayName: params.displayName?.trim() || undefined,
      passwordHash,
      role: invite.role,
      status: UserStatus.ACTIVE,
      inviteAcceptedAt: new Date(),
    },
    create: {
      email: invite.email,
      displayName: params.displayName?.trim() || null,
      passwordHash,
      role: invite.role,
      status: UserStatus.ACTIVE,
      inviteAcceptedAt: new Date(),
    },
  });

  await db.betaInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      acceptedAt: new Date(),
    },
  });

  await createSessionForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  } satisfies AuthenticatedUser;
}
