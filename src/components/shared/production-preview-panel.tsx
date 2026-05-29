"use client";

import {
  PreviewCell,
  PreviewGrid,
  PreviewPanelShell,
} from "@/components/shared/preview-panel";
import { formatNumber } from "@/lib/format";
import { FIELD_LABEL, KPI_LABEL } from "@/lib/terminology";

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
  const delta = stockApres - stockAvant;
  const restantesNegative = restantesJour < 0;
  const restantesPositive = restantesJour > 0;

  return (
    <PreviewPanelShell
      variant={restantesNegative ? "danger" : "default"}
      className="w-full min-w-0"
    >
      <PreviewGrid>
        <PreviewCell
          label={restantesLabel}
          value={`${formatNumber(restantesJour)} alv.`}
          tone={
            restantesNegative ? "danger" : restantesPositive ? "success" : undefined
          }
        />
        <PreviewCell
          label={KPI_LABEL.stockFerme}
          value={`${formatNumber(stockAvant)} alv.`}
        />
        <PreviewCell
          label={FIELD_LABEL.apresEnregistrement}
          value={`${formatNumber(stockApres)} alv.`}
          sub={
            delta !== 0
              ? `(${delta > 0 ? "+" : ""}${formatNumber(delta)})`
              : undefined
          }
          tone={delta < 0 ? "danger" : delta > 0 ? "success" : undefined}
        />
      </PreviewGrid>
    </PreviewPanelShell>
  );
}
