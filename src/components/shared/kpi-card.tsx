import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { surfaceCardClass } from "@/lib/display-tokens";
import {
  kpiHintClass,
  kpiLabelClass,
  textLabelClass,
} from "@/lib/typography-tokens";
import { unitSuffixForLabel } from "@/lib/terminology";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";

const toneValueStyles: Record<Tone, string> = {
  neutral: "text-foreground",
  accent: "text-foreground",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-foreground",
};

const toneIconStyles: Record<Tone, string> = {
  neutral: "text-accent-blue",
  accent: "text-accent-blue",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-accent-blue",
};

export type KpiTrend = {
  value: number;
  label?: string;
};

export type KpiCardProps = {
  label: string;
  /** Valeur déjà formatée (texte libre). */
  value?: React.ReactNode;
  /** Montant numérique — format adaptatif auto (M si ≥ 1M et carte étroite). */
  amount?: number;
  amountKind?: "gnf" | "number";
  amountSuffix?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  trend?: KpiTrend;
  size?: "hero" | "compact" | "mini";
  className?: string;
};

export function KpiCard({
  label,
  value,
  amount,
  amountKind = "gnf",
  amountSuffix,
  hint,
  icon: Icon,
  tone = "neutral",
  trend,
  size = "hero",
  className,
}: KpiCardProps) {
  const isHero = size === "hero";
  const isMini = size === "mini";
  const showColoredIcon = true;
  const resolvedSuffix = unitSuffixForLabel(label, amountSuffix);

  const valueSizeClass = isHero
    ? "text-[clamp(1.125rem,5vw,1.75rem)] leading-none"
    : isMini
      ? "text-[clamp(0.8125rem,2.75vw,0.9375rem)] leading-tight"
      : "text-[clamp(0.9375rem,3.5vw,1.125rem)] leading-tight";

  return (
    <div
      className={cn(
        "@container flex w-full min-w-0 max-w-full flex-col",
        isHero ? "gap-2" : isMini ? "gap-1" : "gap-2",
        surfaceCardClass,
        "transition-[box-shadow,color] duration-150",
        isHero ? "p-4" : isMini ? "p-2" : "p-3",
        className
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          className={cn(
            kpiLabelClass,
            isMini && "text-micro"
          )}
        >
          {label}
        </p>
        {Icon ? (
          <Icon
            className={cn(
              "shrink-0",
              isMini ? "h-3 w-3" : "h-4 w-4",
              showColoredIcon ? toneIconStyles[tone] : "text-muted"
            )}
          />
        ) : null}
      </div>

      <div className="min-w-0 max-w-full">
        {amount !== undefined && amountKind ? (
          <AdaptiveMetric
            value={amount}
            kind={amountKind}
            suffix={resolvedSuffix}
            className={toneValueStyles[tone]}
            amountClassName={cn("font-bold", valueSizeClass)}
          />
        ) : (
          <p
            className={cn(
              "max-w-full truncate font-bold tabular-nums tracking-tight",
              valueSizeClass,
              toneValueStyles[tone]
            )}
          >
            {value}
          </p>
        )}
        {hint ? (
          <p className={cn(kpiHintClass, isMini && "text-micro")}>
            {hint}
          </p>
        ) : null}
      </div>

      {trend ? <KpiTrendBadge trend={trend} /> : null}
    </div>
  );
}

function KpiTrendBadge({ trend }: { trend: KpiTrend }) {
  const isUp = trend.value > 0;
  const isFlat = trend.value === 0;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const styles = isFlat
    ? "text-muted"
    : isUp
      ? "text-success"
      : "text-danger";

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", textLabelClass)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 font-medium tabular-nums",
          styles
        )}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(trend.value)} %
      </span>
      {trend.label ? (
        <span className="truncate text-muted">{trend.label}</span>
      ) : null}
    </div>
  );
}
