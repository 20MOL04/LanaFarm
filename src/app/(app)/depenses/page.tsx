import type { Metadata } from "next";
import { Suspense } from "react";

import { ExpensesModule } from "@/components/expenses/expenses-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Dépenses",
};

export default function DepensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement du module Dépenses…" />
        </div>
      }
    >
      <ExpensesModule />
    </Suspense>
  );
}
