import type { Metadata } from "next";
import { Suspense } from "react";

import { GuideModule } from "@/components/guide/guide-module";
import { ModulePageSkeleton } from "@/components/shared/page-skeletons";

export const metadata: Metadata = {
  title: "Guide d'utilisation",
  description:
    "Guide simple pour utiliser LanaFarm : menu, saisies, chiffres, rapports et conseils au quotidien.",
};

export default function GuidePage() {
  return (
    <Suspense fallback={<ModulePageSkeleton kpiCount={0} withTable={false} />}>
      <GuideModule />
    </Suspense>
  );
}
