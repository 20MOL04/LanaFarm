import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4">
      <div className="w-full max-w-[360px] text-center">
        <p className="login-hero-title" role="heading" aria-level={1}>
          <span className="login-hero-lana">Lana</span>
          <span className="login-hero-farm">Farm</span>
        </p>

        <p className="mt-2 text-base font-semibold text-foreground">Bienvenue</p>
        <p className="mt-1 text-sm text-muted">
          Connectez-vous pour accéder à votre espace de gestion.
        </p>

        <div className="mt-3 rounded-card border border-border bg-card p-5 shadow-card">
          <Suspense
            fallback={
              <p className="py-4 text-center text-sm text-muted">Chargement…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
