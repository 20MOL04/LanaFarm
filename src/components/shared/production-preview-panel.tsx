"use client";

import { PackageCheck } from "lucide-react";

import { formatNumber } from "@/lib/format";
import { KPI_LABEL } from "@/lib/terminology";
import { cn } from "@/lib/utils";

type Props = {
  restantesJour: number;
  stockAvant: number;
  stockApres: number;
  restantesLabel?: string;
};

export function ProductionPreviewPanel({
  restantesJour,
  stockAvant,
  stockApres,
  restantesLabel = "Restantes ce jour",
}: Props) {
  const restantesNegative = restantesJour < 0;
  const restantesPositive = restantesJour > 0;
  const delta = stockApres - stockAvant;

  return (
    <div className="shrink-0 space-y-2 rounded-card border border-border bg-card-muted px-3 py-2.5">
      <PreviewRow
        label={restantesLabel}
        value={formatNumber(restantesJour)}
        suffix="alv."
        tone={
          restantesNegative ? "danger" : restantesPositive ? "success" : "neutral"
        }
      />
      <div className="border-t border-border pt-2">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {KPI_LABEL.alveolesRestantes}
        </p>
        <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
          <span className="text-muted">{formatNumber(stockAvant)} alv.</span>
          <span className="text-muted">→</span>
          <span
            className={cn(
              "font-semibold",
              delta > 0 && "text-success",
              delta < 0 && "text-danger",
              delta === 0 && "text-foreground"
            )}
          >
            {formatNumber(stockApres)} alv.
          </span>
        </div>
        {delta !== 0 ? (
          <p className="mt-0.5 text-[10px] text-muted tabular-nums">
            {delta > 0 ? "+" : ""}
            {formatNumber(delta)} alv. après enregistrement
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix: string;
  tone: "neutral" | "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <PackageCheck
          className={cn(
            "h-3.5 w-3.5",
            tone === "success" && "text-success",
            tone === "danger" && "text-danger",
            tone === "neutral" && "text-muted"
          )}
        />
        <p className="text-[11px] text-muted">{label}</p>
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger"
        )}
      >
        {value} {suffix}
      </span>
    </div>
  );
}
