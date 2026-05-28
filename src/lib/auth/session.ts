import { cookies } from "next/headers";

import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";
import { getAuthConfig } from "@/lib/auth/config";
import { isValidSessionToken } from "@/lib/auth/verify-session";

export { isValidSessionToken } from "@/lib/auth/verify-session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function setSessionCookie(): Promise<void> {
  const { sessionToken } = getAuthConfig();
  const jar = await cookies();
  jar.set(AUTH_SESSION_COOKIE, sessionToken, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_SESSION_COOKIE);
}

export async function hasValidSession(): Promise<boolean> {
  const jar = await cookies();
  return isValidSessionToken(jar.get(AUTH_SESSION_COOKIE)?.value);
}
