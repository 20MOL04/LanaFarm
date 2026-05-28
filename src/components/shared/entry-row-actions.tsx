"use client";

import * as React from "react";
import { Ban, Clock, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";

import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import type { EntreeStatut } from "@/types/domain";

export type EntryRowActionsLabels = {
  menuLabel: string;
  ariaLabel: string;
  edit?: string;
  cancel?: string;
  restore?: string;
  history?: string;
};

type Props = {
  statut: EntreeStatut;
  labels: EntryRowActionsLabels;
  onEdit?: () => void;
  onCancel: () => void;
  onRestore: () => void;
  onOpenHistory: () => void;
  children?: React.ReactNode;
};

/**
 * Menu d'actions commun aux lignes Production / Ventes / Dépenses / Trésorerie.
 * Le dialog Historique reste fourni par le wrapper module (`children`).
 */
export function EntryRowActions({
  statut,
  labels,
  onEdit,
  onCancel,
  onRestore,
  onOpenHistory,
  children,
}: Props) {
  return (
    <>
      <Menu
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={labels.ariaLabel}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <MenuLabel>{labels.menuLabel}</MenuLabel>

        {onEdit && statut === "actif" ? (
          <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
            {labels.edit ?? "Modifier"}
          </MenuItem>
        ) : null}

        {statut === "actif" ? (
          <MenuItem
            tone="danger"
            icon={<Ban className="h-4 w-4" />}
            onClick={onCancel}
          >
            {labels.cancel ?? "Annuler"}
          </MenuItem>
        ) : (
          <MenuItem icon={<RotateCcw className="h-4 w-4" />} onClick={onRestore}>
            {labels.restore ?? "Restaurer"}
          </MenuItem>
        )}

        <MenuSeparator />

        <MenuItem icon={<Clock className="h-4 w-4" />} onClick={onOpenHistory}>
          {labels.history ?? "Historique"}
        </MenuItem>
      </Menu>

      {children}
    </>
  );
}
