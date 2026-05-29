import type { Metadata } from "next";
import { Suspense } from "react";

import { SalesModule } from "@/components/sales/sales-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Ventes",
};

export default function VentesPage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={4} />}>
      <SalesModule />
    </Suspense>
  );
}
