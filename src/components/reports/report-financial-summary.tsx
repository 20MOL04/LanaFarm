"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { formatGNF } from "@/lib/format";
import { SummaryMetricValue } from "@/components/shared/summary-metric-value";
import type { ReportKpiSnapshot } from "@/lib/reports-calc";
import { formatEggsNumber, KPI_LABEL } from "@/lib/terminology";
import { cn } from "@/lib/utils";

type Props = {
  snapshot: ReportKpiSnapshot;
};

/**
 * Bloc financier dense — optimisé pour l'impression A4.
 * Format : 2 colonnes (recettes / sorties) + bandeau profit pleine largeur.
 */
export function ReportFinancialSummary({ snapshot }: Props) {
  const profitPositif = snapshot.profit >= 0;
  const profitZero = snapshot.profit === 0;

  return (
    <SectionCard>
      <SectionHeader title="Synthèse financière" />
      <SectionBody>
        <div className="grid gap-4 md:grid-cols-2">
          <Block
            title="Recettes"
            tone="success"
            rows={[
              {
                label: "Chiffre d'affaires",
                value: formatGNF(snapshot.chiffreAffaires),
                emphasis: true,
              },
              { label: "Montant versé", value: formatGNF(snapshot.montantRemis) },
              {
                label: "Reste à verser",
                value: formatGNF(snapshot.montantEnAttente),
                hint:
                  snapshot.montantEnAttente > 0
                    ? "À déposer rapidement"
                    : undefined,
                tone: snapshot.montantEnAttente > 0 ? "warning" : undefined,
              },
            ]}
          />
          <Block
            title="Sorties"
            tone="danger"
            rows={[
              {
                label: "Dépenses totales",
                value: formatGNF(snapshot.totalDepenses),
                emphasis: true,
              },
              {
                label: KPI_LABEL.oeufsCasses,
                value: formatEggsNumber(snapshot.pertesTotales),
                hint: "Ferme + vente",
                tone: "danger",
                brokenEggs: true,
              },
            ]}
          />
        </div>

        {/* Bandeau profit */}
        <div
          className={cn(
            "mt-4 flex flex-col gap-2 rounded-card border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
            profitZero && "border-border bg-card-muted/60",
            !profitZero && profitPositif && "border-success/20 bg-success-soft/60",
            !profitZero && !profitPositif && "border-danger/30 bg-danger-soft/60"
          )}
        >
          <div>
            <p className="text-label font-medium uppercase tracking-wide text-muted">
              Résultat net estimé
            </p>
            <p
              className={cn(
                "mt-0.5 text-2xl font-semibold tabular-nums",
                profitZero && "text-foreground",
                !profitZero && profitPositif && "text-success",
                !profitZero && !profitPositif && "text-danger"
              )}
            >
              {formatGNF(snapshot.profit)}
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:items-end">
            <div className="flex items-center gap-1.5 text-label text-muted">
              {profitZero ? (
                <Minus className="h-4 w-4" />
              ) : profitPositif ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-danger" />
              )}
              <span>CA − Dépenses</span>
            </div>
            {snapshot.margeBrutePct !== null ? (
              <p className="text-label font-medium text-muted">
                Marge brute :{" "}
                <span
                  className={cn(
                    "tabular-nums",
                    snapshot.margeBrutePct >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {snapshot.margeBrutePct} %
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </SectionBody>
    </SectionCard>
  );
}

/* ===========================================================
   Sous-composants locaux
   =========================================================== */

type Row = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  tone?: "warning" | "danger";
  brokenEggs?: boolean;
};

function Block({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "success" | "danger";
  rows: Row[];
}) {
  return (
    <div className="rounded-card border border-border shadow-card">
      <div
        className={cn(
          "border-b border-border px-4 py-2",
          tone === "success" && "bg-success-soft/40",
          tone === "danger" && "bg-danger-soft/40"
        )}
      >
        <p
          className={cn(
            "text-label font-semibold uppercase tracking-wide",
            tone === "success" ? "text-success" : "text-danger"
          )}
        >
          {title}
        </p>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 px-4 py-2.5"
          >
            <div className="min-w-0">
              <dt className="text-sm text-foreground">{r.label}</dt>
              {r.hint ? (
                <p
                  className={cn(
                    "mt-0.5 text-label",
                    r.tone === "warning" && "text-warning",
                    r.tone === "danger" && "text-danger",
                    !r.tone && "text-muted"
                  )}
                >
                  {r.hint}
                </p>
              ) : null}
            </div>
            <dd
              className={cn(
                "shrink-0 text-right",
                r.emphasis ? "text-base" : "text-sm",
                !r.brokenEggs && r.tone === "warning" && "text-warning",
                !r.brokenEggs && r.tone === "danger" && "text-danger",
                !r.brokenEggs && !r.tone && "text-foreground"
              )}
            >
              <SummaryMetricValue
                value={r.value}
                rowLabel={r.label}
                brokenEggs={r.brokenEggs}
                amountClassName={cn(
                  "tabular-nums",
                  r.emphasis ? "font-semibold" : "font-medium",
                  !r.brokenEggs && r.tone === "warning" && "text-warning",
                  !r.brokenEggs && r.tone === "danger" && "text-danger",
                  !r.brokenEggs && !r.tone && "text-foreground"
                )}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
