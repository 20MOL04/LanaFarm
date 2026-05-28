import { hasValidSession } from "@/lib/auth/session";

export async function requireSession(): Promise<Response | null> {
  if (!(await hasValidSession())) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}
