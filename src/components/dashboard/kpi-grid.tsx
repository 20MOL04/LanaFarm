"use client";

import {
  CircleDollarSign,
  Hourglass,
  PiggyBank,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { useFarmConfig } from "@/contexts/farm-store";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import type { DashboardKpiSnapshot } from "@/lib/dashboard-calc";
import { eggsToTrays, KPI_LABEL } from "@/lib/terminology";

type Props = {
  kpis: DashboardKpiSnapshot;
};

export function KpiGrid({ kpis }: Props) {
  const config = useFarmConfig();
  const capacite = config.preferences.capacitePlateau;
  const profitTone = kpis.profit < 0 ? "danger" : "neutral";
  const attenteTone =
    kpis.montantEnAttente < 0
      ? "danger"
      : kpis.montantEnAttente > 0
        ? "warning"
        : "neutral";

  const labelRestantes = useKpiPeriodLabel(KPI_LABEL.stockFerme, "snapshot");
  const labelStockVente = useKpiPeriodLabel(KPI_LABEL.stockVente, "snapshot");
  const labelCa = useKpiPeriodLabel(KPI_LABEL.chiffreAffaires);
  const labelProfit = useKpiPeriodLabel(KPI_LABEL.profit);
  const labelVerse = useKpiPeriodLabel(KPI_LABEL.montantVerse);
  const labelResteVerser = useKpiPeriodLabel(KPI_LABEL.resteAVerser);
  const labelDepenses = useKpiPeriodLabel(KPI_LABEL.depenses);
  const labelCasses = useKpiPeriodLabel(KPI_LABEL.oeufsCasses);

  return (
    <div className="grid-contained gap-3">
      <div className="grid-contained gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={labelRestantes}
          amount={kpis.alveolesRestantes}
          amountKind="number"
          amountSuffix="alvéoles"
          icon={Warehouse}
          tone={kpis.alveolesRestantes > 0 ? "success" : "neutral"}
          size="hero"
        />
        <KpiCard
          label={labelStockVente}
          amount={eggsToTrays(kpis.stockMagasin, capacite)}
          amountKind="number"
          amountSuffix="alvéoles"
          icon={ShoppingCart}
          tone="neutral"
          size="hero"
        />
        <KpiCard
          label={labelCa}
          amount={kpis.chiffreAffaires}
          amountKind="gnf"
          icon={CircleDollarSign}
          tone="neutral"
          size="hero"
        />
        <KpiCard
          label={labelProfit}
          amount={kpis.profit}
          amountKind="gnf"
          icon={kpis.profit >= 0 ? TrendingUp : TrendingDown}
          tone={profitTone}
          size="hero"
        />
      </div>

      <div className="grid-contained gap-2 grid-cols-2 sm:grid-cols-4">
        <KpiCard
          label={labelVerse}
          amount={kpis.montantRemis}
          amountKind="gnf"
          icon={PiggyBank}
          tone="neutral"
          size="mini"
        />
        <KpiCard
          label={labelResteVerser}
          amount={kpis.montantEnAttente}
          amountKind="gnf"
          icon={Hourglass}
          tone={attenteTone}
          size="mini"
        />
        <KpiCard
          label={labelDepenses}
          amount={kpis.totalDepenses}
          amountKind="gnf"
          icon={Receipt}
          tone="neutral"
          size="mini"
        />
        <KpiCard
          label={labelCasses}
          amount={kpis.pertesTotales}
          amountKind="number"
          amountSuffix="œufs"
          icon={TrendingDown}
          tone="danger"
          size="mini"
        />
      </div>
    </div>
  );
}
