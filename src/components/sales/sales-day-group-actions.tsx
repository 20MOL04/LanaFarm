"use client";

import * as React from "react";

import { SalesRowActions } from "@/components/sales/sales-row-actions";
import { DayGroupRowActions } from "@/components/shared/day-group-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { EntryStatusBadge } from "@/components/shared/entry-status-badge";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { useFarmConfig, useSalesStore } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import type { SalesDayGroup } from "@/lib/day-entry-grouping";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toSaleHistoryRows,
} from "@/lib/history-entry-display";
import { eggsToTrays } from "@/lib/terminology";
import type { SaleRowView } from "@/lib/sales-calc";
import type { Vente } from "@/types/domain";

type Props = {
  group: SalesDayGroup;
  onRequestEdit?: (entry: Vente) => void;
};

function SalesDayDetailItem({
  row,
  cap,
  onRequestEdit,
}: {
  row: SaleRowView;
  cap: number;
  onRequestEdit?: (entry: Vente) => void;
}) {
  const client = row.vente.client?.trim() || "—";
  return (
    <div className="flex items-start justify-between gap-2 rounded-card border border-border bg-card-muted/40 p-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-foreground">
          <span className="font-medium tabular-nums">
            {eggsToTrays(row.vente.vendus, cap)} alv.
          </span>
          <span className="text-muted"> · </span>
          <span className="tabular-nums">{formatGNF(row.vente.prix)}/alv.</span>
        </p>
        <p className="truncate text-label text-muted">Client : {client}</p>
        <div className="flex flex-wrap items-center gap-2">
          <AdaptiveMetric value={row.montant} kind="gnf" className="text-sm font-semibold" />
          <EntryStatusBadge statut={row.vente.statut} size="sm" masculine />
        </div>
      </div>
      <SalesRowActions entry={row.vente} onRequestEdit={onRequestEdit} />
    </div>
  );
}

export function SalesDayGroupActions({ group, onRequestEdit }: Props) {
  const { state, cancelSale, restoreSale, restoreSaleVersion } = useSalesStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const dayLabel = formatDay(new Date(group.jourISO));
  const venteLabel = group.count === 1 ? "1 vente" : `${group.count} ventes`;
  const summaryLine = `${venteLabel} · ${formatGNF(group.totalMontant)}`;
  const single = group.count === 1 ? group.entries[0] : undefined;

  const archivedVersions = React.useMemo(
    () => (single ? filterArchivedVersions(state.ventes, single.vente) : []),
    [single, state.ventes]
  );
  const historyRows = React.useMemo(
    () => (single ? toSaleHistoryRows(archivedVersions, cap) : []),
    [single, archivedVersions, cap]
  );

  const detailContent = (
    <>
      {group.entries.map((row) => (
        <SalesDayDetailItem
          key={row.vente.id}
          row={row}
          cap={cap}
          onRequestEdit={onRequestEdit}
        />
      ))}
    </>
  );

  return (
    <>
      <DayGroupRowActions
        dayLabel={dayLabel}
        summaryLine={summaryLine}
        detailTitle={`Ventes du ${dayLabel}`}
        detailSubtitle={`${formatGNF(group.totalMontant)} · ${venteLabel}`}
        detailContent={detailContent}
        singleEntry={
          single
            ? {
                statut: single.vente.statut,
                onEdit: onRequestEdit ? () => onRequestEdit(single.vente) : undefined,
                onCancel: () => cancelSale(single.vente.id),
                onRestore: () => restoreSale(single.vente.id),
                onOpenHistory: () => setHistoryOpen(true),
                labels: {
                  edit: "Modifier",
                  cancel: "Annuler la vente",
                  restore: "Restaurer la vente",
                  history: "Historique",
                },
              }
            : undefined
        }
      />
      {single ? (
        <HistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          subtitle={formatEntryDaySubtitle(single.vente.jourISO)}
          versions={historyRows}
          onRestore={(archiveId) => {
            restoreSaleVersion(single.vente.id, archiveId);
            setHistoryOpen(false);
          }}
          canRestore={single.vente.statut === "actif"}
        />
      ) : null}
    </>
  );
}
