"use client";

import {
  CircleDollarSign,
  Egg,
  Hourglass,
  PackageCheck,
  PiggyBank,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { MetricValue } from "@/components/shared/metric-value";
import { useFarmConfig } from "@/contexts/farm-store";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { formatGNF } from "@/lib/format";
import type { ReportKpiSnapshot } from "@/lib/reports-calc";
import {
  formatAlveolesNumber,
  formatEggsNumber,
  formatTraysNumber,
  KPI_LABEL,
} from "@/lib/terminology";
import { cn } from "@/lib/utils";

type Props = {
  snapshot: ReportKpiSnapshot;
};

const valueAmountClass =
  "font-bold text-[clamp(0.9375rem,3.5vw,1.125rem)] leading-tight";

export function ReportKpiSummary({ snapshot }: Props) {
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;

  const labelRamassees = useKpiPeriodLabel(KPI_LABEL.alveolesRamassees);
  const labelMises = useKpiPeriodLabel(KPI_LABEL.alveolesMisesEnVente);
  const labelRestantes = useKpiPeriodLabel(KPI_LABEL.stockFerme, "snapshot");
  const labelStockVente = useKpiPeriodLabel(KPI_LABEL.stockVente, "snapshot");
  const labelCa = useKpiPeriodLabel(KPI_LABEL.chiffreAffaires);
  const labelDepenses = useKpiPeriodLabel(KPI_LABEL.depenses);
  const labelProfit = useKpiPeriodLabel(KPI_LABEL.profit);
  const labelCasses = useKpiPeriodLabel(KPI_LABEL.oeufsCasses);
  const labelVerse = useKpiPeriodLabel(KPI_LABEL.montantVerse);
  const labelReste = useKpiPeriodLabel(KPI_LABEL.resteAVerser);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 print:grid-cols-3 print:gap-2">
      <KpiCard
        label={labelRamassees}
        value={
          <MetricValue
            amount={formatAlveolesNumber(snapshot.alveolesRamassees)}
            label={labelRamassees}
            amountClassName={valueAmountClass}
          />
        }
        hint={
          snapshot.saisies.production > 0
            ? `${snapshot.saisies.production} saisie${snapshot.saisies.production > 1 ? "s" : ""}`
            : undefined
        }
        icon={Egg}
        tone="accent"
      />
      <KpiCard
        label={labelMises}
        value={
          <MetricValue
            amount={formatAlveolesNumber(snapshot.alveolesMisesEnVente)}
            label={labelMises}
            amountClassName={valueAmountClass}
          />
        }
        icon={ShoppingCart}
        tone="info"
      />
      <KpiCard
        label={labelRestantes}
        value={
          <MetricValue
            amount={formatAlveolesNumber(snapshot.alveolesRestantes)}
            label={labelRestantes}
            amountClassName={valueAmountClass}
          />
        }
        icon={Warehouse}
        tone="accent"
      />
      <KpiCard
        label={labelStockVente}
        value={
          <MetricValue
            amount={formatTraysNumber(snapshot.stockMagasin, cap)}
            label={labelStockVente}
            amountClassName={valueAmountClass}
          />
        }
        icon={PackageCheck}
        tone="info"
      />
      <KpiCard
        label={labelCa}
        value={formatGNF(snapshot.chiffreAffaires)}
        hint={
          snapshot.saisies.ventes > 0
            ? `${snapshot.saisies.ventes} vente${snapshot.saisies.ventes > 1 ? "s" : ""}`
            : undefined
        }
        icon={CircleDollarSign}
        tone="success"
      />
      <KpiCard
        label={labelDepenses}
        value={formatGNF(snapshot.totalDepenses)}
        hint={
          snapshot.saisies.depenses > 0
            ? `${snapshot.saisies.depenses} ligne${snapshot.saisies.depenses > 1 ? "s" : ""}`
            : undefined
        }
        icon={Receipt}
        tone="danger"
      />
      <KpiCard
        label={labelProfit}
        value={formatGNF(snapshot.profit)}
        hint={
          snapshot.margeBrutePct !== null
            ? `Marge ${snapshot.margeBrutePct} %`
            : undefined
        }
        icon={snapshot.profit >= 0 ? TrendingUp : TrendingDown}
        tone={snapshot.profit >= 0 ? "success" : "danger"}
      />
      <KpiCard
        label={labelCasses}
        value={
          <MetricValue
            amount={formatEggsNumber(snapshot.pertesTotales)}
            label={labelCasses}
            amountClassName={cn(valueAmountClass, "text-danger")}
            unitClassName="text-danger/80"
          />
        }
        icon={TrendingDown}
        tone="danger"
      />
      <KpiCard
        label={labelVerse}
        value={formatGNF(snapshot.montantRemis)}
        icon={PiggyBank}
        tone="success"
      />
      <KpiCard
        label={labelReste}
        value={formatGNF(snapshot.montantEnAttente)}
        icon={Hourglass}
        tone={snapshot.montantEnAttente > 0 ? "warning" : "neutral"}
      />
    </div>
  );
}
