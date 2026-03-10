import type { DecodedIdToken } from "firebase-admin/auth";

import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export type SessionUser = {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatarUrl?: string;
};

function toSessionUser(decodedToken: DecodedIdToken): SessionUser {
  const avatarUrl =
    typeof (decodedToken as DecodedIdToken & { picture?: unknown }).picture === "string"
      ? ((decodedToken as DecodedIdToken & { picture: string }).picture ?? undefined)
      : undefined;

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    emailVerified: decodedToken.email_verified,
    name: decodedToken.name,
    avatarUrl,
  };
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  const items = cookieHeader.split(";");
  for (const item of items) {
    const [key, ...rest] = item.trim().split("=");
    if (key !== name) continue;
    return decodeURIComponent(rest.join("="));
  }

  return null;
}

export function getSessionCookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  return readCookie(cookieHeader, SESSION_COOKIE_NAME);
}

export function getSessionCookieSettings() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  if (!adminAuth) return null;

  const sessionCookie = getSessionCookieValue(request);
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
}
