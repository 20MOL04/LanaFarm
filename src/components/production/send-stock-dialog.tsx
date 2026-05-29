"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { ArrowRight, Warehouse } from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { DialogFormShell } from "@/components/shared/dialog-form-shell";
import { FormField } from "@/components/shared/form-field";
import {
  FORM_INPUT_NOTES,
  FORM_INPUT_NUM_ICON,
  DIALOG_SCROLL,
} from "@/components/shared/form-dialog-styles";
import { PreviewCell, PreviewGrid, PreviewPanelShell } from "@/components/shared/preview-panel";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { Button } from "@/components/ui/button";
import { DialogScrollRegion } from "@/components/ui/dialog";
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
      <DialogFormShell
        open={open}
        onOpenChange={unsaved.dialogProps.onOpenChange}
        title="Envoyer au magasin"
        onSubmit={handleSubmit}
        body={
          <DialogScrollRegion className={cn(DIALOG_SCROLL, "space-y-3")}>
            <StoreErrorBanner error={state.errors} />
            <p className="text-[12px] text-muted">
              Transfert manuel depuis le stock ferme, sans nouvelle collecte ce jour-là.
            </p>
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
              hint="alvéoles"
            >
              <div className="relative">
                <Warehouse className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
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
                  className={FORM_INPUT_NUM_ICON}
                  required
                />
              </div>
            </FormField>
            <FormField label="Notes (optionnel)" htmlFor="send-notes">
              <Textarea
                id="send-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionnel"
                rows={2}
                className={FORM_INPUT_NOTES}
              />
            </FormField>
          </DialogScrollRegion>
        }
        preview={
          <PreviewPanelShell variant={alveoles > stockDispoAlv ? "danger" : "default"}>
            <PreviewGrid cols={2}>
              <PreviewCell
                label="Stock ferme dispo."
                value={`${stockDispoAlv} alv.`}
              />
              <PreviewCell
                label="Après envoi"
                value={`${apresAlv} alv.`}
                tone={apresAlv > 0 ? "success" : undefined}
              />
            </PreviewGrid>
          </PreviewPanelShell>
        }
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={unsaved.requestClose}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
              <ArrowRight className="h-4 w-4" />
              Envoyer au magasin
            </Button>
          </>
        }
      />

      <UnsavedChangesConfirm {...unsaved.confirmDialogProps} />
    </>
  );
}
