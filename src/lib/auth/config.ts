/**
 * Identifiants — variables d'environnement (Vercel / .env.local).
 * En dev uniquement : valeurs fictives si non définies.
 */

export type AuthConfig = {
  /** @deprecated Utiliser allowedEmails — premier e-mail si AUTH_EMAIL seul. */
  email: string;
  allowedEmails: string[];
  password: string;
  sessionToken: string;
};

function devFallback<T>(value: string | undefined, fallback: T): string | T {
  if (value && value.trim().length > 0) return value.trim();
  if (process.env.NODE_ENV === "development") return fallback as string;
  return "";
}

function parseAllowedEmails(): string[] {
  const list = process.env.AUTH_ALLOWED_EMAILS?.trim();
  if (list) {
    return list
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  const single = process.env.AUTH_EMAIL?.trim();
  if (single) return [single.toLowerCase()];
  const dev = devFallback(undefined, "admin@lanafarm.local") as string;
  return dev ? [dev.toLowerCase()] : [];
}

export function getAuthConfig(): AuthConfig {
  const allowedEmails = parseAllowedEmails();
  return {
    email: allowedEmails[0] ?? "",
    allowedEmails,
    password: devFallback(process.env.AUTH_PASSWORD, "lanafarm2026"),
    sessionToken: devFallback(
      process.env.AUTH_SESSION_TOKEN,
      "local-dev-session-change-me"
    ),
  };
}

export function isAuthConfigured(): boolean {
  const { allowedEmails, password, sessionToken } = getAuthConfig();
  return Boolean(allowedEmails.length > 0 && password && sessionToken);
}
