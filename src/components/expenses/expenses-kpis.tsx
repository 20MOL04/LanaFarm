"use client";

import * as React from "react";
import { CalendarRange, CircleDollarSign, PieChart, Receipt } from "lucide-react";
import { endOfWeek, startOfDay, startOfWeek } from "date-fns";

import { getCategoryMeta } from "@/components/expenses/category-meta";
import { KpiCard, type KpiCardProps } from "@/components/shared/kpi-card";
import { useExpensesInRange } from "@/hooks/use-expenses-in-range";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { useDateRange } from "@/contexts/date-range-context";
import { useExpensesStore, useFarmConfig } from "@/contexts/farm-store";
import { kpiDepenses } from "@/lib/kpi-sources";
import { aggregateExpenses } from "@/lib/expenses-calc";
import { KPI_LABEL } from "@/lib/terminology";

export function ExpensesKpis() {
  const expenses = useExpensesInRange();
  const config = useFarmConfig();
  const totals = aggregateExpenses(expenses, config);

  const { range } = useDateRange();
  const { state } = useExpensesStore();

  const totalDepenses = kpiDepenses(
    state.depenses,
    startOfDay(range.from),
    startOfDay(range.to),
    config
  );

  const weekTotal = React.useMemo(() => {
    const weekStart = startOfWeek(range.to, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(range.to, { weekStartsOn: 1 });
    return kpiDepenses(state.depenses, weekStart, weekEnd, config);
  }, [range.to, state.depenses, config]);

  const topMeta = totals.topCategorie
    ? getCategoryMeta(totals.topCategorie.id)
    : null;

  const labelTotal = useKpiPeriodLabel(KPI_LABEL.totalDepenses);
  const labelMoyenne = useKpiPeriodLabel(KPI_LABEL.moyenneJour);

  const topCategoryCard: KpiCardProps = topMeta && totals.topCategorie
    ? {
        label: KPI_LABEL.categoriePrincipale,
        value: totals.topCategorie.label,
        hint: undefined,
        icon: topMeta.icon,
        tone: "neutral",
      }
    : {
        label: KPI_LABEL.categoriePrincipale,
        value: "—",
        icon: PieChart,
        tone: "neutral",
      };

  return (
    <div className="grid-contained gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={labelTotal}
        amount={totalDepenses}
        amountKind="gnf"
        icon={Receipt}
        tone="neutral"
      />
      <KpiCard {...topCategoryCard} />
      <KpiCard
        label={labelMoyenne}
        amount={totals.moyenneJournaliere}
        amountKind="gnf"
        icon={CircleDollarSign}
        tone="neutral"
      />
      <KpiCard
        label="Dépenses cette semaine"
        amount={weekTotal}
        amountKind="gnf"
        icon={CalendarRange}
        tone="neutral"
      />
    </div>
  );
}
