"use client";

import { Clock, RotateCcw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAbsoluteDateTimeFR } from "@/lib/action-display";

export type HistoryVersionRow = {
  id: string;
  archivedAt: string;
  archiveMotif?: string;
  fields: { label: string; value: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  versions: HistoryVersionRow[];
  onRestore: (archiveId: string) => void;
  canRestore?: boolean;
};

/** Versions archivées d'une entrée — dialog partagé (R6C). */
export function HistoryDialog({
  open,
  onOpenChange,
  title = "Versions précédentes",
  subtitle,
  versions,
  onRestore,
  canRestore = true,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted" />
            {title}
          </DialogTitle>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </DialogHeader>

        <DialogBody className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto">
          {versions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Aucune version archivée"
              description="Les prochaines modifications créeront des versions ici."
              className="py-8"
            />
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="rounded-card border border-border bg-card-muted/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted tabular-nums">
                    {formatAbsoluteDateTimeFR(version.archivedAt)}
                  </span>
                  {version.archiveMotif ? (
                    <Badge tone="outline">{version.archiveMotif}</Badge>
                  ) : null}
                </div>

                <dl className="space-y-0.5 text-sm">
                  {version.fields.map((field) => (
                    <div key={field.label} className="flex justify-between gap-2">
                      <dt className="text-muted">{field.label}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {canRestore ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 gap-1.5 text-xs"
                    onClick={() => onRestore(version.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurer
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
