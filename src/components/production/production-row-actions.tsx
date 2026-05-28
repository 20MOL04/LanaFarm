"use client";

import * as React from "react";

import { EntryRowActions } from "@/components/shared/entry-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { useFarmConfig, useProductionStore } from "@/contexts/farm-store";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toProductionHistoryRows,
} from "@/lib/history-entry-display";
import type { Production } from "@/types/domain";

type Props = {
  entry: Production;
  onRequestEdit?: (entry: Production) => void;
};

export function ProductionRowActions({ entry, onRequestEdit }: Props) {
  const { state, cancelProduction, restoreProduction, restoreProductionVersion } =
    useProductionStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const archivedVersions = React.useMemo(
    () => filterArchivedVersions(state.productions, entry),
    [state.productions, entry]
  );

  const historyRows = React.useMemo(
    () => toProductionHistoryRows(archivedVersions, cap),
    [archivedVersions, cap]
  );

  return (
    <EntryRowActions
      statut={entry.statut}
      labels={{
        menuLabel: "Saisie production",
        ariaLabel: "Actions sur la saisie",
        cancel: "Annuler la saisie",
        restore: "Restaurer la saisie",
      }}
      onEdit={onRequestEdit ? () => onRequestEdit(entry) : undefined}
      onCancel={() => cancelProduction(entry.id)}
      onRestore={() => restoreProduction(entry.id)}
      onOpenHistory={() => setHistoryOpen(true)}
    >
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        subtitle={formatEntryDaySubtitle(entry.jourISO)}
        versions={historyRows}
        onRestore={(archiveId) => {
          restoreProductionVersion(entry.id, archiveId);
          setHistoryOpen(false);
        }}
        canRestore={entry.statut === "actif"}
      />
    </EntryRowActions>
  );
}
