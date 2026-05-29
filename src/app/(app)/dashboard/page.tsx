import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardModule } from "@/components/dashboard/dashboard-module";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardModule />
    </Suspense>
  );
}
