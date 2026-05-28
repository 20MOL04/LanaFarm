import { getAuthConfig } from "@/lib/auth/config";

/** Comparaison à durée constante (évite les fuites par timing). */
export function verifyCredentials(email: string, password: string): boolean {
  const cfg = getAuthConfig();
  if (!cfg.email || !cfg.password) return false;

  const emailOk = safeEqual(
    normalizeEmail(email),
    normalizeEmail(cfg.email)
  );
  const passwordOk = safeEqual(password, cfg.password);
  return emailOk && passwordOk;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
