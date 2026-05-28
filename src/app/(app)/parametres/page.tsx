import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsModule } from "@/components/settings/settings-module";
import { Loader } from "@/components/shared/loader";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default function ParametresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader size={20} label="Chargement des paramètres…" />
        </div>
      }
    >
      <SettingsModule />
    </Suspense>
  );
}
