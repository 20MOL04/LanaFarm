"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { ArrowRight, PackageCheck, Warehouse } from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { FormField } from "@/components/shared/form-field";
import { MetricValue } from "@/components/shared/metric-value";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  stockFermeDisponiblePourEnvoi,
  useFarmConfig,
  useTransfersStore,
} from "@/contexts/farm-store";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { formatDay } from "@/lib/date-ranges";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import { KPI_LABEL } from "@/lib/terminology";
import { eggsToTrays } from "@/lib/units";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SendStockFormSnapshot = {
  jourISO: string;
  alveoles: number;
  notes: string;
};

const todayIso = () => format(startOfDay(new Date()), "yyyy-MM-dd");

function emptySendStockSnapshot(): SendStockFormSnapshot {
  return { jourISO: todayIso(), alveoles: 0, notes: "" };
}

export function SendStockDialog({ open, onOpenChange }: Props) {
  const { state, addManualTransfer } = useTransfersStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;

  const [jourISO, setJourISO] = React.useState(todayIso);
  const [alveoles, setAlveoles] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const openSnapshotRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      openSnapshotRef.current = null;
      return;
    }
    const initial = emptySendStockSnapshot();
    setJourISO(initial.jourISO);
    setAlveoles(initial.alveoles);
    setNotes(initial.notes);
    setTouched(false);
    openSnapshotRef.current = stableStringify(initial);
  }, [open]);

  const formSnapshot = React.useMemo(
    (): SendStockFormSnapshot => ({
      jourISO,
      alveoles,
      notes: notes.trim(),
    }),
    [jourISO, alveoles, notes]
  );

  const isDirty = isDirtyComparedToSnapshot(formSnapshot, openSnapshotRef.current);

  const unsaved = useUnsavedDialogClose({
    open,
    isDirty,
    onOpenChange,
  });

  const closeDialog = React.useCallback(
    () => unsaved.closeWithoutConfirm(),
    [unsaved]
  );
  const runSubmit = useStoreSubmitGuard(state.errors, closeDialog);

  const dayDate = React.useMemo(() => {
    if (!jourISO) return null;
    const d = new Date(jourISO);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [jourISO]);

  const stockDispoOeufs = React.useMemo(() => {
    if (!dayDate) return 0;
    return stockFermeDisponiblePourEnvoi(
      state.productions,
      state.transferts,
      dayDate
    );
  }, [dayDate, state.productions, state.transferts]);

  const stockDispoAlv = eggsToTrays(stockDispoOeufs, cap);
  const apresAlv = Math.max(0, stockDispoAlv - alveoles);

  const quantiteError =
    touched && alveoles <= 0
      ? "Indiquez au moins 1 alvéole."
      : touched && alveoles > stockDispoAlv
        ? `Stock ferme insuffisant. Disponible : ${stockDispoAlv} alv.`
        : undefined;

  const canSubmit =
    !!dayDate && alveoles > 0 && alveoles <= stockDispoAlv;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || !dayDate) return;

    runSubmit(() => {
      addManualTransfer({
        jourISO: dayDate.toISOString(),
        quantiteAlveoles: alveoles,
        notes: notes.trim() ? notes.trim() : undefined,
      });
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={unsaved.dialogProps.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer au magasin</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody className="space-y-3">
              <StoreErrorBanner error={state.errors} />

              <p className="text-[12px] text-muted">
                Transfert manuel depuis le stock ferme, sans nouvelle collecte ce jour-là.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Jour"
                  htmlFor="send-day"
                  required
                  hint={dayDate ? formatDay(dayDate) : undefined}
                >
                  <DateInput
                    id="send-day"
                    value={jourISO}
                    max={todayIso()}
                    onChange={(e) => setJourISO(e.target.value)}
                    required
                  />
                </FormField>

                <FormField
                  label="Alvéoles à envoyer"
                  htmlFor="send-alv"
                  required
                  error={quantiteError}
                >
                  <div className="relative">
                    <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
                    <Input
                      id="send-alv"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={Number.isFinite(alveoles) ? alveoles : 0}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === "") {
                          setAlveoles(0);
                          return;
                        }
                        const n = parseInt(raw, 10);
                        setAlveoles(Number.isNaN(n) ? 0 : Math.max(0, n));
                      }}
                      onBlur={() => setTouched(true)}
                      onFocus={(e) => e.currentTarget.select()}
                      className="pl-9 tabular-nums"
                      required
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Notes (optionnel)" htmlFor="send-notes">
                <Textarea
                  id="send-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex : Complément pour le magasin du samedi"
                  rows={2}
                />
              </FormField>

              <StockPreview
                disponible={stockDispoAlv}
                apres={apresAlv}
                depasse={alveoles > stockDispoAlv}
              />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={unsaved.requestClose}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                disabled={!canSubmit}
              >
                <ArrowRight className="h-4 w-4" />
                Envoyer au magasin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UnsavedChangesConfirm {...unsaved.confirmDialogProps} />
    </>
  );
}

function StockPreview({
  disponible,
  apres,
  depasse,
}: {
  disponible: number;
  apres: number;
  depasse: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border px-3 py-2.5",
        depasse ? "border-danger/30 bg-danger-soft/60" : "border-border bg-card-muted"
      )}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Stock ferme disponible
          </p>
          <MetricValue
            amount={disponible}
            label={KPI_LABEL.alveolesRestantes}
            amountClassName="text-sm font-semibold tabular-nums text-foreground"
          />
          <p className="text-[10px] text-muted">alv.</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Après envoi
          </p>
          <MetricValue
            amount={apres}
            label="Reste ferme"
            amountClassName={cn(
              "text-sm font-semibold tabular-nums",
              apres > 0 ? "text-success" : "text-muted"
            )}
          />
          <p className="text-[10px] text-muted">alv.</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
        <PackageCheck className="h-3.5 w-3.5 shrink-0" />
        Basé sur le stock ferme instantané (collectes − cassés − envois production).
      </div>
    </div>
  );
}
