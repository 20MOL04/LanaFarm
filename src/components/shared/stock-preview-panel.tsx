"use client";

import {
  PreviewCell,
  PreviewGrid,
  PreviewPanelShell,
} from "@/components/shared/preview-panel";
import { formatGNF, formatNumber } from "@/lib/format";

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
    <PreviewPanelShell
      variant={stockNegatif ? "danger" : "default"}
      className="w-full min-w-0"
    >
      <PreviewGrid>
        <PreviewCell
          label="Stock disponible"
          value={`${formatNumber(stockDisponible)} alv.`}
        />
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
      </PreviewGrid>
    </PreviewPanelShell>
  );
}
