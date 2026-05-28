"use client";

import * as React from "react";

import { EntryRowActions } from "@/components/shared/entry-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { useExpensesStore } from "@/contexts/farm-store";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toExpenseHistoryRows,
} from "@/lib/history-entry-display";
import type { Depense } from "@/types/domain";

type Props = {
  entry: Depense;
  onRequestEdit?: (entry: Depense) => void;
};

export function ExpensesRowActions({ entry, onRequestEdit }: Props) {
  const { state, cancelExpense, restoreExpense, restoreExpenseVersion } =
    useExpensesStore();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const archivedVersions = React.useMemo(
    () => filterArchivedVersions(state.depenses, entry),
    [state.depenses, entry]
  );

  const historyRows = React.useMemo(
    () => toExpenseHistoryRows(archivedVersions),
    [archivedVersions]
  );

  return (
    <EntryRowActions
      statut={entry.statut}
      labels={{
        menuLabel: "Dépense",
        ariaLabel: "Actions sur la dépense",
        cancel: "Annuler la dépense",
        restore: "Restaurer la dépense",
      }}
      onEdit={onRequestEdit ? () => onRequestEdit(entry) : undefined}
      onCancel={() => cancelExpense(entry.id)}
      onRestore={() => restoreExpense(entry.id)}
      onOpenHistory={() => setHistoryOpen(true)}
    >
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        subtitle={formatEntryDaySubtitle(entry.jourISO)}
        versions={historyRows}
        onRestore={(archiveId) => {
          restoreExpenseVersion(entry.id, archiveId);
          setHistoryOpen(false);
        }}
        canRestore={entry.statut === "actif"}
      />
    </EntryRowActions>
  );
}
