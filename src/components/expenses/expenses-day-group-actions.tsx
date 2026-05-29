"use client";

import * as React from "react";

import { CategoryBadge } from "@/components/expenses/category-badge";
import { ExpensesRowActions } from "@/components/expenses/expenses-row-actions";
import { DayGroupRowActions } from "@/components/shared/day-group-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { EntryStatusBadge } from "@/components/shared/entry-status-badge";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { useExpensesStore } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import type { ExpenseDayGroup } from "@/lib/day-entry-grouping";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toExpenseHistoryRows,
} from "@/lib/history-entry-display";
import type { Depense } from "@/types/domain";

type Props = {
  group: ExpenseDayGroup;
  onRequestEdit?: (entry: Depense) => void;
};

function ExpenseDayDetailItem({
  entry,
  onRequestEdit,
}: {
  entry: Depense;
  onRequestEdit?: (entry: Depense) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-card border border-border bg-card-muted/40 p-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={entry.categorie} />
          <AdaptiveMetric value={entry.montant} kind="gnf" className="text-sm font-semibold" />
          <EntryStatusBadge statut={entry.statut} size="sm" />
        </div>
        {entry.description?.trim() ? (
          <p className="line-clamp-2 text-label text-muted">{entry.description.trim()}</p>
        ) : (
          <p className="text-label text-muted">—</p>
        )}
      </div>
      <ExpensesRowActions entry={entry} onRequestEdit={onRequestEdit} />
    </div>
  );
}

export function ExpensesDayGroupActions({ group, onRequestEdit }: Props) {
  const { state, cancelExpense, restoreExpense, restoreExpenseVersion } = useExpensesStore();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const dayLabel = formatDay(new Date(group.jourISO));
  const depLabel = group.count === 1 ? "1 dépense" : `${group.count} dépenses`;
  const summaryLine = `${depLabel} · ${formatGNF(group.totalMontant)}`;
  const single = group.count === 1 ? group.entries[0] : undefined;

  const archivedVersions = React.useMemo(
    () => (single ? filterArchivedVersions(state.depenses, single) : []),
    [single, state.depenses]
  );
  const historyRows = React.useMemo(
    () => (single ? toExpenseHistoryRows(archivedVersions) : []),
    [single, archivedVersions]
  );

  const detailContent = (
    <>
      {group.entries.map((entry) => (
        <ExpenseDayDetailItem key={entry.id} entry={entry} onRequestEdit={onRequestEdit} />
      ))}
    </>
  );

  return (
    <>
      <DayGroupRowActions
        dayLabel={dayLabel}
        summaryLine={summaryLine}
        detailTitle={`Dépenses du ${dayLabel}`}
        detailSubtitle={`${formatGNF(group.totalMontant)} · ${depLabel}`}
        detailContent={detailContent}
        singleEntry={
          single
            ? {
                statut: single.statut,
                onEdit: onRequestEdit ? () => onRequestEdit(single) : undefined,
                onCancel: () => cancelExpense(single.id),
                onRestore: () => restoreExpense(single.id),
                onOpenHistory: () => setHistoryOpen(true),
                labels: {
                  edit: "Modifier",
                  cancel: "Annuler la dépense",
                  restore: "Restaurer la dépense",
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
            restoreExpenseVersion(single.id, archiveId);
            setHistoryOpen(false);
          }}
          canRestore={single.statut === "actif"}
        />
      ) : null}
    </>
  );
}
