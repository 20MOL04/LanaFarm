import { NextResponse } from "next/server";

import { isAuthConfigured } from "@/lib/auth/config";
import { verifyCredentials } from "@/lib/auth/credentials";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Authentification non configurée sur le serveur." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-mail et mot de passe requis." },
      { status: 400 }
    );
  }

  if (!verifyCredentials(email, password)) {
    return NextResponse.json(
      { error: "E-mail ou mot de passe incorrect." },
      { status: 401 }
    );
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
