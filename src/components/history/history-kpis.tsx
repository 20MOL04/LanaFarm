"use client";

import { Ban, CheckCircle2, History, PenLine } from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import type { HistoryCounters } from "@/lib/history-calc";

type Props = {
  counters: HistoryCounters;
};

export function HistoryKpis({ counters }: Props) {
  const labelActions = useKpiPeriodLabel("Actions");
  const labelModifs = useKpiPeriodLabel("Modifications");
  const labelAnnulations = useKpiPeriodLabel("Annulations");
  const labelValidations = useKpiPeriodLabel("Validations");

  return (
    <div className="grid-contained gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={labelActions}
        amount={counters.total}
        amountKind="number"
        icon={History}
        tone="neutral"
        size="compact"
      />
      <KpiCard
        label={labelModifs}
        amount={counters.modifications}
        amountKind="number"
        icon={PenLine}
        tone="neutral"
        size="compact"
      />
      <KpiCard
        label={labelAnnulations}
        amount={counters.annulations}
        amountKind="number"
        icon={Ban}
        tone={counters.annulations > 0 ? "danger" : "neutral"}
        size="compact"
      />
      <KpiCard
        label={labelValidations}
        amount={counters.validations}
        amountKind="number"
        icon={CheckCircle2}
        tone="neutral"
        size="compact"
      />
    </div>
  );
}
