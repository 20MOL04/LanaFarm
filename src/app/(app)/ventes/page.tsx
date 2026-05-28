import type { Metadata } from "next";
import { Suspense } from "react";

import { SalesModule } from "@/components/sales/sales-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Ventes",
};

export default function VentesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement du module Ventes…" />
        </div>
      }
    >
      <SalesModule />
    </Suspense>
  );
}
