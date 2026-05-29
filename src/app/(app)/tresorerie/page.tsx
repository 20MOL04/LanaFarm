import type { Metadata } from "next";
import { Suspense } from "react";

import { TresorerieModule } from "@/components/tresorerie/tresorerie-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Trésorerie",
};

export default function TresoreriePage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={4} />}>
      <TresorerieModule />
    </Suspense>
  );
}
