"use client";

import * as React from "react";

import { EntryRowActions } from "@/components/shared/entry-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { useTresorerieStore } from "@/contexts/farm-store";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toTresorerieHistoryRows,
} from "@/lib/history-entry-display";
import type { Tresorerie } from "@/types/domain";

type Props = {
  entry: Tresorerie;
  onRequestEdit?: (entry: Tresorerie) => void;
};

export function TresorerieRowActions({ entry, onRequestEdit }: Props) {
  const { state, cancelTresorerie, restoreTresorerie, restoreTresorerieVersion } =
    useTresorerieStore();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const archivedVersions = React.useMemo(
    () => filterArchivedVersions(state.tresorerie, entry),
    [state.tresorerie, entry]
  );

  const historyRows = React.useMemo(
    () => toTresorerieHistoryRows(archivedVersions),
    [archivedVersions]
  );

  return (
    <EntryRowActions
      statut={entry.statut}
      labels={{
        menuLabel: "Trésorerie",
        ariaLabel: "Actions trésorerie",
        cancel: "Annuler",
        restore: "Restaurer",
      }}
      onEdit={onRequestEdit ? () => onRequestEdit(entry) : undefined}
      onCancel={() => cancelTresorerie(entry.id)}
      onRestore={() => restoreTresorerie(entry.id)}
      onOpenHistory={() => setHistoryOpen(true)}
    >
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        subtitle={formatEntryDaySubtitle(entry.jourISO)}
        versions={historyRows}
        onRestore={(archiveId) => {
          restoreTresorerieVersion(entry.id, archiveId);
          setHistoryOpen(false);
        }}
        canRestore={entry.statut === "actif"}
      />
    </EntryRowActions>
  );
}
