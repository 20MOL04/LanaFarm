"use client";

import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { brokenEggsValueClass, metricUnitClass } from "@/lib/display-tokens";
import { UNIT_OEUFS } from "@/lib/terminology";
import { cn } from "@/lib/utils";

type BrokenEggsMetricProps = {
  value: number;
  className?: string;
  /** Afficher l'unité « œufs » en petit (défaut : oui). */
  showUnit?: boolean;
};

/**
 * Affiche un nombre d'œufs cassés ou de pertes — toujours en rouge (`text-danger`),
 * unité plus petite que le chiffre.
 */
export function BrokenEggsMetric({
  value,
  className,
  showUnit = true,
}: BrokenEggsMetricProps) {
  return (
    <AdaptiveMetric
      value={value}
      kind="number"
      suffix={showUnit ? UNIT_OEUFS : undefined}
      className={className}
      amountClassName={brokenEggsValueClass}
      unitClassName={cn(metricUnitClass, "text-danger/80")}
    />
  );
}
