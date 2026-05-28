"use client";

import {
  PreviewCell,
  PreviewGrid,
  PreviewPanelShell,
} from "@/components/shared/preview-panel";
import { formatGNF } from "@/lib/format";

type Props = {
  total: number;
  ligneCount: number;
  totalLabel: string;
};

export function ExpensePreviewPanel({ total, ligneCount, totalLabel }: Props) {
  return (
    <PreviewPanelShell className="w-full min-w-0">
      <PreviewGrid cols={2}>
        <PreviewCell
          label={totalLabel}
          value={
            ligneCount > 0
              ? `${ligneCount} ligne${ligneCount > 1 ? "s" : ""}`
              : "—"
          }
        />
        <PreviewCell label="Montant" value={formatGNF(total)} />
      </PreviewGrid>
    </PreviewPanelShell>
  );
}
