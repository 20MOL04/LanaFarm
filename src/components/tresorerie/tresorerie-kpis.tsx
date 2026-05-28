"use client";

import { CheckCircle2, Hourglass, PiggyBank, Wallet2 } from "lucide-react";

import { getMethodMeta } from "@/components/tresorerie/method-meta";
import { KpiCard, type KpiCardProps } from "@/components/shared/kpi-card";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { useFarmConfig, useSalesStore, useTresorerieStore } from "@/contexts/farm-store";
import { useTresorerieInRange } from "@/hooks/use-tresorerie-in-range";
import { kpiMontantVerse, kpiResteAVerser } from "@/lib/kpi-sources";
import { aggregateTresorerie } from "@/lib/tresorerie-calc";
import { KPI_LABEL } from "@/lib/terminology";

export function TresorerieKpis() {
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const tresorerie = useTresorerieInRange();
  const { state: salesState } = useSalesStore();
  const { state: tresorerieState } = useTresorerieStore();

  const totals = aggregateTresorerie(tresorerie, config);
  const montantVerse = kpiMontantVerse(tresorerie);
  const resteAVerser = kpiResteAVerser(
    salesState.ventes,
    tresorerieState.tresorerie,
    cap
  );

  const topMeta = totals.topMethode
    ? getMethodMeta(totals.topMethode.id)
    : null;

  const labelRecu = useKpiPeriodLabel("Total reçu");
  const labelVerse = useKpiPeriodLabel(KPI_LABEL.montantVerse);
  const labelReste = useKpiPeriodLabel(KPI_LABEL.resteAVerser);

  const topMethodCard: KpiCardProps = topMeta && totals.topMethode
    ? {
        label: "Méthode principale",
        value: totals.topMethode.label,
        icon: topMeta.icon,
        tone: "neutral",
      }
    : {
        label: "Méthode principale",
        value: "—",
        icon: Wallet2,
        tone: "neutral",
      };

  return (
    <div className="grid-contained gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={labelRecu}
        amount={totals.totalRecu}
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
        tone={resteAVerser > 0 ? "warning" : "neutral"}
      />
      <KpiCard {...topMethodCard} />
    </div>
  );
}
