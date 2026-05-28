"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FileDown } from "lucide-react";

import { ActivityChart } from "@/components/dashboard/activity-chart";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useDateRange } from "@/contexts/date-range-context";
import { moduleOverviewSubtitle } from "@/lib/kpi-period";
import {
  useTresorerieStore,
  useExpensesStore,
  useFarmConfig,
  useProductionStore,
  useSalesStore,
  useTransfersStore,
} from "@/contexts/farm-store";
import { useTresorerieInRange } from "@/hooks/use-tresorerie-in-range";
import { useExpensesInRange } from "@/hooks/use-expenses-in-range";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import { useSalesInRange } from "@/hooks/use-sales-in-range";
import { buildActivityTimeline, buildDashboardKpis } from "@/lib/dashboard-calc";

/**
 * Dashboard — centre de contrôle opérationnel.
 *
 * Source unique de vérité : le FarmStoreProvider (layout (app)/).
 * Aucune logique métier ici — tout passe par `lib/dashboard-calc.ts`
 * qui réutilise les helpers des modules.
 *
 * Réagit intégralement à la plage globale (DateRangeProvider).
 */
export function DashboardModule() {
  const { range, presetId } = useDateRange();

  const pageSubtitle = React.useMemo(
    () => moduleOverviewSubtitle(presetId, range),
    [presetId, range]
  );

  // Données filtrées par la plage globale (réactives au calendrier).
  const productionsInRange = useProductionsInRange();
  const ventesInRange = useSalesInRange();
  const depensesInRange = useExpensesInRange();
  const tresorerieInRange = useTresorerieInRange();

  const { state: prodState } = useProductionStore();
  const { state: salesState } = useSalesStore();
  const { state: expState } = useExpensesStore();
  const { state: tresorerieState } = useTresorerieStore();
  const { getAllTransfers } = useTransfersStore();
  const allTransferts = getAllTransfers();
  const config = useFarmConfig();

  /* ===========================================================
     KPIs
     =========================================================== */

  const kpis = React.useMemo(
    () =>
      buildDashboardKpis({
        productionsInRange,
        ventesInRange,
        depensesInRange,
        tresorerieInRange,
        allProductions: prodState.productions,
        allTresorerie: tresorerieState.tresorerie,
        allTransferts,
        allVentes: salesState.ventes,
        allDepenses: expState.depenses,
        rangeStart: range.from,
        rangeEnd: range.to,
        capacitePlateau: config.preferences.capacitePlateau,
        config,
      }),
    [
      productionsInRange,
      ventesInRange,
      depensesInRange,
      tresorerieInRange,
      prodState.productions,
      tresorerieState.tresorerie,
      allTransferts,
      salesState.ventes,
      expState.depenses,
      range.from,
      range.to,
      config.preferences.capacitePlateau,
      config,
    ]
  );

  /* ===========================================================
     Série temporelle pour le graphique
     =========================================================== */

  const timeline = React.useMemo(
    () =>
      buildActivityTimeline(
        range.from,
        range.to,
        productionsInRange,
        ventesInRange,
        depensesInRange
      ),
    [range, productionsInRange, ventesInRange, depensesInRange]
  );

  /* ===========================================================
     Rendu
     =========================================================== */

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={pageSubtitle}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/rapports">
                <FileDown className="h-4 w-4" />
                Générer rapport
              </Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/production?action=ajouter">
                Nouvelle saisie
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <KpiGrid kpis={kpis} />

      <div className="grid-contained grid-cols-1 items-start gap-4 xl:grid-cols-[1.7fr_minmax(0,16.5rem)]">
        <ActivityChart data={timeline} />
        <QuickActions />
      </div>

      <RecentActivity />
    </>
  );
}
