"use client";

import * as React from "react";
import { Ban, Clock, List, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";

import { DayGroupDetailDialog } from "@/components/shared/day-group-detail-dialog";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";

type SingleEntryActions = {
  statut: "actif" | "annule" | "archive";
  onEdit?: () => void;
  onCancel: () => void;
  onRestore: () => void;
  onOpenHistory: () => void;
  labels: {
    edit: string;
    cancel: string;
    restore: string;
    history: string;
  };
};

type Props = {
  dayLabel: string;
  summaryLine: string;
  detailTitle: string;
  detailSubtitle?: string;
  detailContent: React.ReactNode;
  singleEntry?: SingleEntryActions;
};

export function DayGroupRowActions({
  dayLabel,
  summaryLine,
  detailTitle,
  detailSubtitle,
  detailContent,
  singleEntry,
}: Props) {
  const [detailOpen, setDetailOpen] = React.useState(false);

  return (
    <>
      <Menu
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Actions du ${dayLabel}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <MenuLabel>{dayLabel}</MenuLabel>
        <li className="px-2.5 pb-1 text-label normal-case tracking-normal text-muted">
          {summaryLine}
        </li>
        <MenuSeparator />
        <MenuItem icon={<List className="h-4 w-4" />} onClick={() => setDetailOpen(true)}>
          Voir le détail
        </MenuItem>
        {singleEntry ? (
          <>
            <MenuSeparator />
            {singleEntry.onEdit && singleEntry.statut === "actif" ? (
              <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={singleEntry.onEdit}>
                {singleEntry.labels.edit}
              </MenuItem>
            ) : null}
            {singleEntry.statut === "actif" ? (
              <MenuItem
                tone="danger"
                icon={<Ban className="h-4 w-4" />}
                onClick={singleEntry.onCancel}
              >
                {singleEntry.labels.cancel}
              </MenuItem>
            ) : (
              <MenuItem icon={<RotateCcw className="h-4 w-4" />} onClick={singleEntry.onRestore}>
                {singleEntry.labels.restore}
              </MenuItem>
            )}
            <MenuItem icon={<Clock className="h-4 w-4" />} onClick={singleEntry.onOpenHistory}>
              {singleEntry.labels.history}
            </MenuItem>
          </>
        ) : null}
      </Menu>

      <DayGroupDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={detailTitle}
        subtitle={detailSubtitle}
      >
        {detailContent}
      </DayGroupDetailDialog>
    </>
  );
}
