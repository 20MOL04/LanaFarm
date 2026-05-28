"use client";

import * as React from "react";
import { LineChart } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import type { ActivityPoint, ActivityMetricKey } from "@/lib/dashboard-calc";
import { formatGNFCompact, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ActivityChartTooltip } from "@/components/dashboard/activity-chart-tooltip";

type MetricKey = ActivityMetricKey;

type MetricConfig = {
  key: MetricKey;
  label: string;
  unit: "GNF" | "alv";
  color: string;
  gradient: string;
};

const METRICS: Record<MetricKey, MetricConfig> = {
  profit: {
    key: "profit",
    label: "Profit",
    unit: "GNF",
    color: "var(--color-success)",
    gradient: "lf-grad-profit",
  },
  ca: {
    key: "ca",
    label: "CA",
    unit: "GNF",
    color: "var(--color-accent-blue)",
    gradient: "lf-grad-ca",
  },
  depenses: {
    key: "depenses",
    label: "Dépenses",
    unit: "GNF",
    color: "var(--color-danger)",
    gradient: "lf-grad-depenses",
  },
  production: {
    key: "production",
    label: "Production",
    unit: "alv",
    color: "var(--color-warning)",
    gradient: "lf-grad-production",
  },
};

type ActivityChartProps = {
  data: ActivityPoint[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  const [metric, setMetric] = React.useState<MetricKey>("profit");
  const cfg = METRICS[metric];

  const formattedData = React.useMemo(
    () =>
      data.map((p) => ({
        ...p,
        labelX: format(new Date(p.dateISO), "d MMM", { locale: fr }),
      })),
    [data]
  );

  const hasData =
    formattedData.length > 0 &&
    formattedData.some((p) => p[metric] !== 0);

  return (
    <SectionCard>
      <SectionHeader
        title="Activité"
        actions={
          <div className="flex flex-wrap items-center gap-1.5 rounded-button bg-card-muted p-1">
            {(Object.keys(METRICS) as MetricKey[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={metric === key ? "primary" : "ghost"}
                onClick={() => setMetric(key)}
                className={cn(
                  "h-7 px-3 text-xs",
                  metric !== key && "text-muted hover:text-foreground"
                )}
              >
                {METRICS[key].label}
              </Button>
            ))}
          </div>
        }
      />
      <SectionBody>
        <ChartShell>
          {!hasData ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={LineChart}
                title="Aucune donnée sur la période"
                description={`Aucune valeur ${cfg.label.toLowerCase()} pour la plage sélectionnée.`}
              />
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
              <defs>
                <linearGradient id={cfg.gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="labelX"
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted)"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted)"
                fontSize={11}
                tickFormatter={(v: number) =>
                  cfg.unit === "GNF" ? formatGNFCompact(v) : formatCompact(v)
                }
                width={70}
              />
              <Tooltip
                cursor={{
                  stroke: cfg.color,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                content={(props) => (
                  <ActivityChartTooltip
                    active={props.active}
                    payload={props.payload}
                    metricCfg={cfg}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey={metric}
                name={cfg.label}
                stroke={cfg.color}
                strokeWidth={2}
                fill={`url(#${cfg.gradient})`}
                activeDot={{
                  r: 5,
                  fill: cfg.color,
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </ChartShell>
      </SectionBody>
    </SectionCard>
  );
}

/**
 * Évite le warning Recharts au SSG : on n'instancie le graphique
 * qu'après l'hydratation, quand le conteneur a une taille réelle.
 */
function ChartShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <div className="h-[240px] w-full min-w-0 max-w-full sm:h-[280px]">
      {mounted ? children : null}
    </div>
  );
}
