"use client";

import {
  formatCompact,
  formatGNF,
  formatGNFCompact,
  formatNumber,
  MILLION_THRESHOLD,
} from "@/lib/format";
import { MetricValue } from "@/components/shared/metric-value";
import { cn } from "@/lib/utils";

type AdaptiveMetricProps = {
  value: number;
  kind: "gnf" | "number";
  /** Unité sans espace initial — ex. « œufs », « alvéoles ». */
  suffix?: string;
  className?: string;
  /** Classes sur le chiffre uniquement (ex. font-bold text-lg). */
  amountClassName?: string;
  unitClassName?: string;
};

/**
 * Affiche un montant ou un nombre :
 * - &lt; 1 M : toujours en entier
 * - ≥ 1 M : version courte si la carte est étroite (container query).
 * - Unité en plus petit que le chiffre.
 */
export function AdaptiveMetric({
  value,
  kind,
  suffix = "",
  className,
  amountClassName,
  unitClassName,
}: AdaptiveMetricProps) {
  const unit = suffix.trim() || undefined;

  if (kind === "gnf") {
    const full = formatGNF(value);
    const compact = formatGNFCompact(value);
    const useAdaptive = Math.abs(value) >= MILLION_THRESHOLD;

    if (!useAdaptive) {
      return (
        <span
          className={cn("block max-w-full truncate", className, amountClassName)}
          title={full}
        >
          {full}
        </span>
      );
    }

    return (
      <span
        className={cn(
          "@container/metric block w-full min-w-0 max-w-full",
          className
        )}
        title={full}
      >
        <span
          className={cn(
            "block max-w-full truncate @[9.5rem]:hidden",
            amountClassName
          )}
        >
          {compact}
        </span>
        <span
          className={cn(
            "hidden max-w-full truncate @[9.5rem]:block",
            amountClassName
          )}
        >
          {full}
        </span>
      </span>
    );
  }

  const numFull = formatNumber(value);
  const numCompact = formatCompact(value);
  const useAdaptive = Math.abs(value) >= MILLION_THRESHOLD;
  const title = unit ? `${numFull} ${unit}` : numFull;

  if (!useAdaptive) {
    return (
      <span className={cn("block max-w-full truncate", className)} title={title}>
        <MetricValue
          amount={numFull}
          unit={unit}
          amountClassName={amountClassName}
          unitClassName={unitClassName}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "@container/metric block w-full min-w-0 max-w-full",
        className
      )}
      title={title}
    >
      <MetricValue
        amount={numCompact}
        unit={unit}
        className="max-w-full truncate @[9.5rem]:hidden"
        amountClassName={amountClassName}
        unitClassName={unitClassName}
      />
      <MetricValue
        amount={numFull}
        unit={unit}
        className="hidden max-w-full truncate @[9.5rem]:block"
        amountClassName={amountClassName}
        unitClassName={unitClassName}
      />
    </span>
  );
}
