"use client";

import type { ElementType } from "react";
import { Egg, Receipt, ShoppingCart, Wallet } from "lucide-react";

import { SectionBody, SectionCard } from "@/components/shared/section-card";
import { SummaryMetricValue } from "@/components/shared/summary-metric-value";
import type { ReportPayload, ProductionSummaryRow } from "@/lib/reports-calc";
import { cn } from "@/lib/utils";

type Props = {
  payload: ReportPayload;
};

function SummaryCard({
  title,
  subtitle,
  rows,
  tone,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  rows: ProductionSummaryRow[];
  tone: "accent" | "success" | "danger" | "info";
  icon: ElementType;
}) {
  const toneBorder = {
    accent: "border-l-accent",
    success: "border-l-success",
    danger: "border-l-danger",
    info: "border-l-info",
  }[tone];

  return (
    <SectionCard className={cn("border-l-[3px]", toneBorder)}>
      <SectionBody compact>
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-label text-muted">{subtitle}</p>
          </div>
        </div>
        <dl className="space-y-1.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <dt className="text-muted">{row.label}</dt>
              <dd>
                <SummaryMetricValue
                  value={row.value}
                  rowLabel={row.label}
                  brokenEggs={row.variant === "broken-eggs"}
                />
              </dd>
            </div>
          ))}
        </dl>
      </SectionBody>
    </SectionCard>
  );
}

/** Résumés figés depuis un ReportPayload archivé. */
export function ReportArchivedSummaries({ payload }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 print:break-inside-avoid">
      <SummaryCard
        icon={Egg}
        tone="accent"
        title="Production"
        subtitle="Snapshot archivé"
        rows={payload.productionRows}
      />
      <SummaryCard
        icon={ShoppingCart}
        tone="success"
        title="Ventes"
        subtitle="Snapshot archivé"
        rows={payload.salesRows}
      />
      <SummaryCard
        icon={Receipt}
        tone="danger"
        title="Dépenses"
        subtitle="Snapshot archivé"
        rows={payload.expensesRows}
      />
      <SummaryCard
        icon={Wallet}
        tone="info"
        title="Trésorerie"
        subtitle="Snapshot archivé"
        rows={payload.treasuryRows}
      />
    </div>
  );
}
