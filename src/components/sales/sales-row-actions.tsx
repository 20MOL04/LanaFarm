"use client";

import * as React from "react";

import { EntryRowActions } from "@/components/shared/entry-row-actions";
import { HistoryDialog } from "@/components/shared/history-dialog";
import { useFarmConfig, useSalesStore } from "@/contexts/farm-store";
import {
  filterArchivedVersions,
  formatEntryDaySubtitle,
  toSaleHistoryRows,
} from "@/lib/history-entry-display";
import type { Vente } from "@/types/domain";

type Props = {
  entry: Vente;
  onRequestEdit?: (entry: Vente) => void;
};

export function SalesRowActions({ entry, onRequestEdit }: Props) {
  const { state, cancelSale, restoreSale, restoreSaleVersion } = useSalesStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const archivedVersions = React.useMemo(
    () => filterArchivedVersions(state.ventes, entry),
    [state.ventes, entry]
  );

  const historyRows = React.useMemo(
    () => toSaleHistoryRows(archivedVersions, cap),
    [archivedVersions, cap]
  );

  return (
    <EntryRowActions
      statut={entry.statut}
      labels={{
        menuLabel: "Saisie vente",
        ariaLabel: "Actions sur la vente",
        cancel: "Annuler la vente",
        restore: "Restaurer la vente",
      }}
      onEdit={onRequestEdit ? () => onRequestEdit(entry) : undefined}
      onCancel={() => cancelSale(entry.id)}
      onRestore={() => restoreSale(entry.id)}
      onOpenHistory={() => setHistoryOpen(true)}
    >
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        subtitle={formatEntryDaySubtitle(entry.jourISO)}
        versions={historyRows}
        onRestore={(archiveId) => {
          restoreSaleVersion(entry.id, archiveId);
          setHistoryOpen(false);
        }}
        canRestore={entry.statut === "actif"}
      />
    </EntryRowActions>
  );
}
