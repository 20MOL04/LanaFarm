import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductionModule } from "@/components/production/production-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Production",
};

export default function ProductionPage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={4} />}>
      <ProductionModule />
    </Suspense>
  );
}
