import type { Metadata } from "next";
import { Suspense } from "react";

import { HistoryModule } from "@/components/history/history-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Historique",
};

export default function HistoriquePage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={0} />}>
      <HistoryModule />
    </Suspense>
  );
}
