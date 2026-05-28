import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardModule } from "@/components/dashboard/dashboard-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement du Dashboard…" />
        </div>
      }
    >
      <DashboardModule />
    </Suspense>
  );
}
