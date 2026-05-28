import { getAuthConfig } from "@/lib/auth/config";

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const { sessionToken } = getAuthConfig();
  if (!sessionToken) return false;
  if (token.length !== sessionToken.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i);
  }
  return mismatch === 0;
}
