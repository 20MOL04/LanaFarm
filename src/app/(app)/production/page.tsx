import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductionModule } from "@/components/production/production-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Production",
};

export default function ProductionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement du module Production…" />
        </div>
      }
    >
      <ProductionModule />
    </Suspense>
  );
}
