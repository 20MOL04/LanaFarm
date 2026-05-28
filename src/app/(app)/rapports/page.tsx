import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsModule } from "@/components/reports/reports-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Rapports",
};

export default function RapportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement des rapports…" />
        </div>
      }
    >
      <ReportsModule />
    </Suspense>
  );
}
