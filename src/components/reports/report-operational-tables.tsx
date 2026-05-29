"use client";

import { Egg, Receipt, ShoppingCart, Wallet } from "lucide-react";

import { SectionBody, SectionCard } from "@/components/shared/section-card";
import {
  buildExpensesSummary,
  buildProductionSummary,
  buildSalesSummary,
  buildTreasurySummary,
  type ExpensesSummaryRow,
  type ProductionSummaryRow,
  type SalesSummaryRow,
  type TreasurySummaryRow,
} from "@/lib/reports-calc";
import type { Depense, Tresorerie, Production, Vente } from "@/types/domain";
import { SummaryMetricValue } from "@/components/shared/summary-metric-value";
import { useDateRange } from "@/contexts/date-range-context";
import {
  useExpensesStore,
  useFarmConfig,
  useSalesStore,
  useTresorerieStore,
} from "@/contexts/farm-store";
import { cn } from "@/lib/utils";

type Props = {
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
};

/**
 * 4 mini résumés alignés — pensés pour une lecture rapide en réunion et
 * un rendu propre sur A4 (chaque carte = un bloc insécable).
 */
export function ReportOperationalTables({
  productions,
  ventes,
  depenses,
  tresorerie,
}: Props) {
  const { range } = useDateRange();
  const config = useFarmConfig();
  const { state: salesState } = useSalesStore();
  const { state: expensesState } = useExpensesStore();
  const { state: tresorerieState } = useTresorerieStore();
  const cap = config.preferences.capacitePlateau;
  const rangeStart = range.from;
  const rangeEnd = range.to;
  const production = buildProductionSummary(
    productions,
    cap,
    rangeStart,
    rangeEnd
  );
  const sales = buildSalesSummary(ventes, productions, cap, rangeStart, rangeEnd);
  const expenses = buildExpensesSummary(depenses, rangeStart, rangeEnd, config);
  const treasury = buildTreasurySummary({
    tresorerieInRange: tresorerie,
    allTresorerie: tresorerieState.tresorerie,
    ventes: salesState.ventes,
    depenses: expensesState.depenses,
    config,
    capacitePlateau: cap,
    rangeStart,
    rangeEnd,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 print:break-inside-avoid">
      <MiniSummaryCard
        icon={Egg}
        tone="accent"
        title="Production"
        subtitle="Ramassées, transferts et pertes"
        rows={production.rows}
      />
      <MiniSummaryCard
        icon={ShoppingCart}
        tone="success"
        title="Ventes"
        subtitle="Volumes, CA et prix moyen"
        rows={sales.rows}
      />
      <MiniSummaryCard
        icon={Receipt}
        tone="danger"
        title="Dépenses"
        subtitle="Charges et catégorie principale"
        rows={expenses.rows}
      />
      <MiniSummaryCard
        icon={Wallet}
        tone="info"
        title="Trésorerie"
        subtitle="Reçu, déposé et en attente"
        rows={treasury.rows}
      />
    </div>
  );
}

/* ===========================================================
   Sous-composant — carte résumé compacte
   =========================================================== */

type Tone = "accent" | "success" | "danger" | "info";

const TONE_HEADER: Record<Tone, string> = {
  accent: "bg-accent-blue-soft/60 text-accent-blue",
  success: "bg-success-soft/60 text-success",
  danger: "bg-danger-soft/60 text-danger",
  info: "bg-info-soft/60 text-info",
};

function MiniSummaryCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  rows,
}: {
  icon: React.ElementType;
  tone: Tone;
  title: string;
  subtitle: string;
  rows: ProductionSummaryRow[] | SalesSummaryRow[] | ExpensesSummaryRow[] | TreasurySummaryRow[];
}) {
  return (
    <SectionCard className="print:break-inside-avoid">
      {/* Header custom (l'icône à gauche du titre nécessite un ReactNode,
          ce que SectionHeader.title ne supporte pas à cause de l'intersection
          avec React.HTMLAttributes<HTMLDivElement>.title: string). */}
      <div className="flex flex-col gap-1 px-6 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-pill",
                TONE_HEADER[tone]
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            {title}
          </h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <SectionBody>
        <dl className="divide-y divide-border rounded-card border border-border shadow-card">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <dt className="text-sm text-foreground">{r.label}</dt>
                {r.hint ? (
                  <p className="mt-0.5 text-[11px] text-muted">{r.hint}</p>
                ) : null}
              </div>
              <dd className="shrink-0 text-right text-sm">
                <SummaryMetricValue
                  value={r.value}
                  rowLabel={r.label}
                  brokenEggs={r.variant === "broken-eggs"}
                />
              </dd>
            </div>
          ))}
        </dl>
      </SectionBody>
    </SectionCard>
  );
}
