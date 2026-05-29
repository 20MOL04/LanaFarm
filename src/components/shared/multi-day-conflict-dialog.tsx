"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDayListFR } from "@/lib/multi-day";
import type { MultiDayConflictResolution } from "@/lib/multi-day";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictDays: string[];
  onResolve: (resolution: MultiDayConflictResolution) => void;
};

/** Conflit multi-jours — remplacer, ignorer ou annuler. */
export function MultiDayConflictDialog({
  open,
  onOpenChange,
  conflictDays,
  onResolve,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Jours déjà saisis</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-2 text-sm text-muted">
          <p>Ces jours ont déjà des données :</p>
          <p className="font-medium text-foreground">{formatDayListFR(conflictDays)}</p>
          <p className="text-xs">Que souhaitez-vous faire ?</p>
        </DialogBody>
        <DialogFooter className="grid-cols-1 [&>button:only-child]:col-span-1">
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="w-full"
            onClick={() => {
              onResolve("replace");
              onOpenChange(false);
            }}
          >
            Remplacer tout
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => {
              onResolve("ignore");
              onOpenChange(false);
            }}
          >
            Ignorer ces jours
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
