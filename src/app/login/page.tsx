import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileKeyboardFix } from "@/components/layout/mobile-keyboard-fix";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] min-h-[var(--vvh,100dvh)] flex-col items-center justify-center bg-background px-4 py-8">
      <MobileKeyboardFix />
      <div className="w-full max-w-[380px] text-center">
        <div className="flex justify-center">
          <BrandLogo variant="login" size="lg" priority className="drop-shadow-sm" />
        </div>

        <p className="mt-5 text-lg font-semibold text-foreground">Bienvenue</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Connectez-vous pour accéder à votre espace de gestion avicole.
        </p>

        <div className="mt-6 rounded-card border border-border bg-card p-5 shadow-card">
          <Suspense
            fallback={
              <p className="py-4 text-center text-sm text-muted">Chargement…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Production, ventes et trésorerie — tout votre suivi en un seul endroit.
        </p>
      </div>
    </div>
  );
}
