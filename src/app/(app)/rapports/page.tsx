import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

const ReportsModule = dynamic(
  () =>
    import("@/components/reports/reports-module").then((m) => ({
      default: m.ReportsModule,
    })),
  {
    loading: () => <ModulePageSkeleton kpiCount={4} />,
  }
);

export const metadata: Metadata = {
  title: "Rapports",
};

export default function RapportsPage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={4} />}>
      <ReportsModule />
    </Suspense>
  );
}
