"use client";

import {
  CircleDollarSign,
  Hourglass,
  PackageOpen,
  ShoppingBag,
  TrendingDown,
} from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";
import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import { useDateRange } from "@/contexts/date-range-context";
import {
  useExpensesStore,
  useFarmConfig,
  useSalesStore,
  useTransfersStore,
  useTresorerieStore,
} from "@/contexts/farm-store";
import { useKpiPeriodLabel } from "@/hooks/use-kpi-period-label";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import { useSalesInRange } from "@/hooks/use-sales-in-range";
import { kpiCA, kpiResteAVerser, kpiStockMagasin } from "@/lib/kpi-sources";
import { aggregateSales } from "@/lib/sales-calc";
import { KPI_LABEL, SALES_LABEL } from "@/lib/terminology";

export function SalesKpis() {
  const sales = useSalesInRange();
  const productions = useProductionsInRange();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const totals = aggregateSales(sales, productions, cap);

  const { range } = useDateRange();
  const { state: salesState } = useSalesStore();
  const { state: expensesState } = useExpensesStore();
  const { state: tresorerieState } = useTresorerieStore();
  const { getAllTransfers } = useTransfersStore();

  const stockMagasin = kpiStockMagasin(
    getAllTransfers(),
    salesState.ventes,
    cap
  );
  const chiffreAffaires = kpiCA(
    salesState.ventes,
    range.from,
    range.to,
    cap
  );
  const resteAVerser = kpiResteAVerser(
    salesState.ventes,
    expensesState.depenses,
    tresorerieState.tresorerie,
    cap,
    config
  );

  const labelStockVente = useKpiPeriodLabel(KPI_LABEL.stockVente, "snapshot");
  const labelVendues = useKpiPeriodLabel(SALES_LABEL.alveolesVendues);
  const labelCasses = useKpiPeriodLabel(KPI_LABEL.oeufsCasses);
  const labelCa = useKpiPeriodLabel(KPI_LABEL.chiffreAffaires);
  const labelReste = useKpiPeriodLabel(KPI_LABEL.resteAVerser);

  return (
    <div className="grid-contained grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label={labelStockVente}
        amount={stockMagasin}
        amountKind="number"
        amountSuffix="alvéoles"
        icon={PackageOpen}
        tone="neutral"
      />
      <KpiCard
        label={labelVendues}
        amount={totals.alveolesVendues}
        amountKind="number"
        amountSuffix="alvéoles"
        icon={ShoppingBag}
        tone="neutral"
      />
      {SHOW_VENTE_CASSES ? (
        <KpiCard
          label={labelCasses}
          amount={totals.casses}
          amountKind="number"
          amountSuffix="œufs"
          icon={TrendingDown}
          tone="danger"
        />
      ) : null}
      <KpiCard
        label={labelCa}
        amount={chiffreAffaires}
        amountKind="gnf"
        icon={CircleDollarSign}
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
    </div>
  );
}
