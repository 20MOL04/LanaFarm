import type { Metadata } from "next";
import { Suspense } from "react";

import { HistoryModule } from "@/components/history/history-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Historique",
};

export default function HistoriquePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement de l'historique…" />
        </div>
      }
    >
      <HistoryModule />
    </Suspense>
  );
}
