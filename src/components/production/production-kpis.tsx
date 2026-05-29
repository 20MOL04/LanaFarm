"use client";

import { Egg, PackageCheck, ShoppingCart, TrendingDown } from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { useFarmConfig, useProductionStore, useTransfersStore } from "@/contexts/farm-store";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import {
  kpiAlveolesFerme,
  kpiAlveolesMisesEnVente,
  kpiAlveolesRamassees,
} from "@/lib/kpi-sources";
import { aggregateProductions } from "@/lib/production-calc";
import { KPI_LABEL } from "@/lib/terminology";

export function ProductionKpis() {
  const productions = useProductionsInRange();
  const { state } = useProductionStore();
  const { getAllTransfers } = useTransfersStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;

  const alveolesRamassees = kpiAlveolesRamassees(productions, cap);
  const alveolesMisesEnVente = kpiAlveolesMisesEnVente(productions, cap);
  const alveolesRestantes = kpiAlveolesFerme(
    state.productions,
    getAllTransfers(),
    cap
  );

  const prodTotals = aggregateProductions(productions, cap);

  const labelRamassees = useKpiPeriodLabel(KPI_LABEL.alveolesRamassees);
  const labelMises = useKpiPeriodLabel(KPI_LABEL.alveolesMisesEnVente);
  const labelRestantes = useKpiPeriodLabel(KPI_LABEL.stockFerme, "snapshot");
  const labelCasses = useKpiPeriodLabel(KPI_LABEL.oeufsCasses);

  return (
    <div className="grid-contained items-start gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={labelRamassees}
        amount={alveolesRamassees}
        amountKind="number"
        amountSuffix="alvéoles"
        icon={Egg}
        tone="neutral"
      />
      <KpiCard
        label={labelMises}
        amount={alveolesMisesEnVente}
        amountKind="number"
        amountSuffix="alvéoles"
        icon={ShoppingCart}
        tone="info"
      />
      <KpiCard
        label={labelRestantes}
        amount={alveolesRestantes}
        amountKind="number"
        amountSuffix="alvéoles"
        icon={PackageCheck}
        tone={alveolesRestantes > 0 ? "success" : "neutral"}
      />
      <KpiCard
        label={labelCasses}
        amount={prodTotals.oeufsCasses}
        amountKind="number"
        amountSuffix="œufs"
        icon={TrendingDown}
        tone="danger"
      />
    </div>
  );
}
