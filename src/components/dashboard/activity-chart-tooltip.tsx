"use client";

import type { ActivityMetricKey, ActivityPoint } from "@/lib/dashboard-calc";
import {
  formatActivityTooltipDate,
  formatActivityTooltipValue,
} from "@/lib/activity-chart-format";

export type ActivityChartMetricConfig = {
  key: ActivityMetricKey;
  label: string;
  color: string;
};

type ChartRow = ActivityPoint & { labelX: string };

type ActivityChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  metricCfg: ActivityChartMetricConfig;
};

/**
 * Infobulle graphique Activité — une ligne par information, sans doublon axe.
 * Ordre : date complète → nom métrique → valeur détaillée.
 */
export function ActivityChartTooltip({
  active,
  payload,
  metricCfg,
}: ActivityChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row?.dateISO) return null;

  const value = row[metricCfg.key];
  if (!Number.isFinite(value)) return null;

  const shortDate = formatActivityTooltipDate(row.dateISO);

  return (
    <div
      role="tooltip"
      className="pointer-events-none max-w-[190px] rounded border border-border bg-card px-2 py-1.5 text-left shadow-sm"
      style={{ borderLeftWidth: 2, borderLeftColor: metricCfg.color }}
    >
      <p className="truncate text-caption leading-tight text-muted">{shortDate}</p>
      <p className="mt-0.5 text-label font-semibold leading-tight text-foreground">
        {metricCfg.label}
        <span className="mx-1 font-normal text-muted">·</span>
        <span className="tabular-nums">
          {formatActivityTooltipValue(metricCfg.key, value)}
        </span>
      </p>
    </div>
  );
}
