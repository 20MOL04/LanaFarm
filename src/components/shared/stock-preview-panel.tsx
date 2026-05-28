"use client";

import { formatGNF, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  stockDisponible: number;
  stockApres: number;
  montant: number;
  stockNegatif: boolean;
  deltaAlv?: number;
  caLabel?: string;
};

export function StockPreviewPanel({
  stockDisponible,
  stockApres,
  montant,
  stockNegatif,
  deltaAlv,
  caLabel = "CA du jour",
}: Props) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-card border px-3 py-2.5",
        stockNegatif ? "border-danger/30 bg-danger-soft/60" : "border-border bg-card-muted"
      )}
    >
      <div className="grid grid-cols-3 gap-2 text-sm">
        <PreviewCell label="Stock disponible" value={`${formatNumber(stockDisponible)} alv.`} />
        <PreviewCell
          label="Après vente"
          value={`${formatNumber(stockApres)} alv.`}
          sub={
            deltaAlv != null && deltaAlv !== 0
              ? `(${deltaAlv > 0 ? "+" : ""}${formatNumber(deltaAlv)})`
              : undefined
          }
          tone={stockNegatif ? "danger" : undefined}
        />
        <PreviewCell label={caLabel} value={formatGNF(montant)} />
      </div>
    </div>
  );
}

function PreviewCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "danger";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "font-semibold tabular-nums",
          tone === "danger" ? "text-danger" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-[10px] text-muted tabular-nums">{sub}</p> : null}
    </div>
  );
}
