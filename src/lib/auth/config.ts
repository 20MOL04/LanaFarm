/**
 * Identifiants — variables d'environnement (Vercel / .env.local).
 * En dev uniquement : valeurs fictives si non définies.
 */

export type AuthConfig = {
  email: string;
  password: string;
  sessionToken: string;
};

function devFallback<T>(value: string | undefined, fallback: T): string | T {
  if (value && value.trim().length > 0) return value.trim();
  if (process.env.NODE_ENV === "development") return fallback as string;
  return "";
}

export function getAuthConfig(): AuthConfig {
  return {
    email: devFallback(process.env.AUTH_EMAIL, "admin@lanafarm.local"),
    password: devFallback(process.env.AUTH_PASSWORD, "lanafarm2026"),
    sessionToken: devFallback(
      process.env.AUTH_SESSION_TOKEN,
      "local-dev-session-change-me"
    ),
  };
}

export function isAuthConfigured(): boolean {
  const { email, password, sessionToken } = getAuthConfig();
  return Boolean(email && password && sessionToken);
}
