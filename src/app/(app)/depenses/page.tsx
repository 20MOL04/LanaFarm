import type { Metadata } from "next";
import { Suspense } from "react";

import { ExpensesModule } from "@/components/expenses/expenses-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Dépenses",
};

export default function DepensesPage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={4} />}>
      <ExpensesModule />
    </Suspense>
  );
}
