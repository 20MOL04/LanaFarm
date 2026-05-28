import type { Metadata } from "next";
import { Suspense } from "react";

import { TresorerieModule } from "@/components/tresorerie/tresorerie-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Trésorerie",
};

export default function TresoreriePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement du module Trésorerie…" />
        </div>
      }
    >
      <TresorerieModule />
    </Suspense>
  );
}
