"use client";

import { CheckCircle2, Hourglass, PiggyBank, Wallet2 } from "lucide-react";

import { getMethodMeta } from "@/components/tresorerie/method-meta";
import { KpiCard, type KpiCardProps } from "@/components/shared/kpi-card";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { useDateRange } from "@/contexts/date-range-context";
import {
  useExpensesStore,
  useFarmConfig,
  useSalesStore,
  useTresorerieStore,
} from "@/contexts/farm-store";
import { useTresorerieInRange } from "@/hooks/use-tresorerie-in-range";
import {
  kpiResteAVerser,
  kpiTresorerieRecuPeriode,
  kpiTresorerieVersePeriode,
} from "@/lib/kpi-sources";
import { aggregateTresorerie } from "@/lib/tresorerie-calc";
import { KPI_LABEL } from "@/lib/terminology";

export function TresorerieKpis() {
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const tresorerie = useTresorerieInRange();
  const { range } = useDateRange();
  const { state: salesState } = useSalesStore();
  const { state: expensesState } = useExpensesStore();
  const { state: tresorerieState } = useTresorerieStore();

  const totals = aggregateTresorerie(tresorerie, config);
  const totalRecu = kpiTresorerieRecuPeriode(
    tresorerieState.tresorerie,
    range.from,
    range.to
  );
  const montantVerse = kpiTresorerieVersePeriode(
    tresorerieState.tresorerie,
    range.from,
    range.to
  );
  const resteAVerser = kpiResteAVerser(
    salesState.ventes,
    expensesState.depenses,
    tresorerieState.tresorerie,
    cap,
    config
  );

  const topMeta = totals.topMethode
    ? getMethodMeta(totals.topMethode.id)
    : null;

  const labelRecu = useKpiPeriodLabel(KPI_LABEL.totalRecu);
  const labelVerse = useKpiPeriodLabel(KPI_LABEL.montantVerse);
  const labelReste = useKpiPeriodLabel(KPI_LABEL.resteAVerser);

  const topMethodCard: KpiCardProps = topMeta && totals.topMethode
    ? {
        label: KPI_LABEL.methodePrincipale,
        value: totals.topMethode.label,
        icon: topMeta.icon,
        tone: "neutral",
      }
    : {
        label: KPI_LABEL.methodePrincipale,
        value: "—",
        icon: Wallet2,
        tone: "neutral",
      };

  return (
    <div className="grid-contained gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={labelRecu}
        amount={totalRecu}
        amountKind="gnf"
        icon={PiggyBank}
        tone="neutral"
      />
      <KpiCard
        label={labelVerse}
        amount={montantVerse}
        amountKind="gnf"
        icon={CheckCircle2}
        tone="neutral"
      />
      <KpiCard
        label={labelReste}
        amount={resteAVerser}
        amountKind="gnf"
        icon={Hourglass}
        tone={
          resteAVerser < 0 ? "danger" : resteAVerser > 0 ? "warning" : "neutral"
        }
      />
      <KpiCard {...topMethodCard} />
    </div>
  );
}
