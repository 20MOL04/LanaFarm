import * as React from "react";

import { metricUnitClass } from "@/lib/display-tokens";
import { unitSuffixForLabel } from "@/lib/terminology";
import { cn } from "@/lib/utils";

export { metricUnitClass };

type MetricValueProps = {
  /** Chiffre formaté (sans unité). */
  amount: React.ReactNode;
  /** Unité explicite — ex. « alvéoles », « œufs ». */
  unit?: string;
  /**
   * Libellé parent (titre KPI, colonne, etc.) — si l'unité y est déjà
   * implicite, `unit` est ignorée.
   */
  label?: string;
  className?: string;
  amountClassName?: string;
  unitClassName?: string;
};

/**
 * Valeur métrique : chiffre dominant + unité discrète (pas la même taille).
 */
export function MetricValue({
  amount,
  unit,
  label,
  className,
  amountClassName,
  unitClassName,
}: MetricValueProps) {
  const unitLabel = unitSuffixForLabel(label ?? "", unit);
  if (!unitLabel) {
    return (
      <span className={cn("tabular-nums", amountClassName, className)}>
        {amount}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-baseline gap-1",
        className
      )}
    >
      <span className={cn("tabular-nums", amountClassName)}>{amount}</span>
      <span className={cn(metricUnitClass, unitClassName)}>{unitLabel}</span>
    </span>
  );
}
