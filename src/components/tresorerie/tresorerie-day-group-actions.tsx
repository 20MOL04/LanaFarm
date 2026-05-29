"use client";

import * as React from "react";

import { MethodBadge } from "@/components/tresorerie/method-badge";
import { TresorerieRowActions } from "@/components/tresorerie/tresorerie-row-actions";
import { DayGroupRowActions } from "@/components/shared/day-group-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { EntryStatusBadge } from "@/components/shared/entry-status-badge";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { useTresorerieStore } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import type { TresorerieDayGroup } from "@/lib/day-entry-grouping";
import { calcReste } from "@/lib/tresorerie-calc";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toTresorerieHistoryRows,
} from "@/lib/history-entry-display";
import { cn } from "@/lib/utils";
import type { Tresorerie } from "@/types/domain";

type Props = {
  group: TresorerieDayGroup;
  onRequestEdit?: (entry: Tresorerie) => void;
};

function TresorerieDayDetailItem({
  entry,
  onRequestEdit,
}: {
  entry: Tresorerie;
  onRequestEdit?: (entry: Tresorerie) => void;
}) {
  const reste = calcReste(entry);

  return (
    <div className="flex items-start justify-between gap-2 rounded-card border border-border bg-card-muted/40 p-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={entry.methode} />
          <AdaptiveMetric value={entry.depose} kind="gnf" className="text-sm font-semibold" />
          <EntryStatusBadge statut={entry.statut} masculine size="sm" />
        </div>
        <div className="flex flex-wrap gap-x-3 text-[11px] text-muted">
          <span>Reçu {formatGNF(entry.montantRecu)}</span>
          {reste !== 0 ? (
            <span className={cn(reste > 0 && "text-warning", reste < 0 && "text-danger")}>
              Reste {formatGNF(reste)}
            </span>
          ) : null}
        </div>
        {entry.note?.trim() ? (
          <p className="line-clamp-2 text-[11px] text-muted">{entry.note.trim()}</p>
        ) : null}
      </div>
      <TresorerieRowActions entry={entry} onRequestEdit={onRequestEdit} />
    </div>
  );
}

export function TresorerieDayGroupActions({ group, onRequestEdit }: Props) {
  const { state, cancelTresorerie, restoreTresorerie, restoreTresorerieVersion } =
    useTresorerieStore();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const dayLabel = formatDay(new Date(group.jourISO));
  const versementLabel =
    group.count === 1 ? "1 versement" : `${group.count} versements`;
  const summaryLine = `${versementLabel} · ${formatGNF(group.totalDepose)}`;
  const single = group.count === 1 ? group.entries[0] : undefined;

  const archivedVersions = React.useMemo(
    () => (single ? filterArchivedVersions(state.tresorerie, single) : []),
    [single, state.tresorerie]
  );
  const historyRows = React.useMemo(
    () => (single ? toTresorerieHistoryRows(archivedVersions) : []),
    [single, archivedVersions]
  );

  const detailContent = (
    <>
      {group.entries.map((entry) => (
        <TresorerieDayDetailItem key={entry.id} entry={entry} onRequestEdit={onRequestEdit} />
      ))}
    </>
  );

  return (
    <>
      <DayGroupRowActions
        dayLabel={dayLabel}
        summaryLine={summaryLine}
        detailTitle={`Versements du ${dayLabel}`}
        detailSubtitle={`${formatGNF(group.totalDepose)} · ${versementLabel}`}
        detailContent={detailContent}
        singleEntry={
          single
            ? {
                statut: single.statut,
                onEdit: onRequestEdit ? () => onRequestEdit(single) : undefined,
                onCancel: () => cancelTresorerie(single.id),
                onRestore: () => restoreTresorerie(single.id),
                onOpenHistory: () => setHistoryOpen(true),
                labels: {
                  edit: "Modifier",
                  cancel: "Annuler le versement",
                  restore: "Restaurer le versement",
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
          subtitle={formatEntryDaySubtitle(single.jourISO)}
          versions={historyRows}
          onRestore={(archiveId) => {
            restoreTresorerieVersion(single.id, archiveId);
            setHistoryOpen(false);
          }}
          canRestore={single.statut === "actif"}
        />
      ) : null}
    </>
  );
}
