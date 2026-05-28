import { MetricValue } from "@/components/shared/metric-value";
import { brokenEggsValueClass } from "@/lib/display-tokens";
import { unitSuffixForLabel } from "@/lib/terminology";
import { cn } from "@/lib/utils";

/** @deprecated Préférer `value` = chiffre seul + libellé de ligne explicite. */
export function parseMetricLabel(
  value: string
): { amount: string; unit: string } | null {
  const m = value.trim().match(/^(.+?)\s+(œufs|alvéoles)$/u);
  if (!m) return null;
  return { amount: m[1], unit: m[2] };
}

type SummaryMetricValueProps = {
  value: string;
  /** Libellé de la ligne — évite la double unité. */
  rowLabel?: string;
  amountClassName?: string;
  unitClassName?: string;
  brokenEggs?: boolean;
};

/**
 * Affiche une valeur de résumé : chiffre seul, ou ancien format « 12 alvéoles ».
 */
export function SummaryMetricValue({
  value,
  rowLabel,
  amountClassName,
  unitClassName,
  brokenEggs,
}: SummaryMetricValueProps) {
  const parsed = parseMetricLabel(value);
  if (!parsed) {
    return <>{value}</>;
  }

  return (
    <MetricValue
      amount={parsed.amount}
      unit={unitSuffixForLabel(rowLabel ?? "", parsed.unit)}
      label={rowLabel}
      amountClassName={cn(
        brokenEggs ? brokenEggsValueClass : "font-semibold",
        amountClassName
      )}
      unitClassName={cn(brokenEggs && "text-danger/80", unitClassName)}
    />
  );
}
