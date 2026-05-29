"use client";

import * as React from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ArrowRight, AlertTriangle, Warehouse } from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { DialogFormShell } from "@/components/shared/dialog-form-shell";
import { FormField } from "@/components/shared/form-field";
import {
  DIALOG_COMPACT_MAX,
  FORM_INPUT_NOTES,
  FORM_INPUT_NUM_ICON,
  DIALOG_SCROLL,
} from "@/components/shared/form-dialog-styles";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { Button } from "@/components/ui/button";
import { DialogScrollRegion } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFarmConfig, useTransfersStore } from "@/contexts/farm-store";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { formatDay } from "@/lib/date-ranges";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import { kpiAlveolesFermeAt } from "@/lib/kpi-sources";
import { eggsToTrays } from "@/lib/units";
import {
  ACTION_LABEL,
  FIELD_LABEL,
  KPI_LABEL,
  UNIT_ALVEOLES,
} from "@/lib/terminology";
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

function StockFermePreviewBar({
  stockDispoAlv,
  apresAlv,
  overLimit,
}: {
  stockDispoAlv: number;
  apresAlv: number;
  overLimit: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-label",
        overLimit && "text-danger"
      )}
      aria-live="polite"
    >
      <div className="min-w-0 truncate">
        <span className="text-muted">{KPI_LABEL.stockFerme}</span>
        <span className="ml-1 font-semibold tabular-nums text-foreground">
          {stockDispoAlv} {UNIT_ALVEOLES}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-muted">{FIELD_LABEL.apresEnvoi}</span>
        <span
          className={cn(
            "ml-1 font-semibold tabular-nums",
            overLimit ? "text-danger" : "text-foreground"
          )}
        >
          {apresAlv} {UNIT_ALVEOLES}
        </span>
      </div>
    </div>
  );
}

function SendStockPathWarning({
  misesEnVenteAlv,
  stockDispoAlv,
}: {
  misesEnVenteAlv: number;
  stockDispoAlv: number;
}) {
  if (misesEnVenteAlv <= 0) return null;

  const message =
    stockDispoAlv <= 0
      ? `Tout le stock de ce jour est déjà couvert par « ${KPI_LABEL.alveolesMisesEnVente} » (${misesEnVenteAlv} ${UNIT_ALVEOLES}). Modifiez la saisie Production plutôt qu'un envoi manuel.`
      : `Ce jour a déjà ${misesEnVenteAlv} ${UNIT_ALVEOLES} en « ${KPI_LABEL.alveolesMisesEnVente} » via Production. Un envoi manuel supplémentaire augmentera le stock vente sans retirer à nouveau le ${KPI_LABEL.stockFerme.toLowerCase()}.`;

  return (
    <div
      role="status"
      className="flex gap-2 rounded-md border border-warning/25 bg-warning-soft/60 px-2.5 py-2 text-label leading-snug text-warning"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
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

  const stockDispoAlv = React.useMemo(() => {
    if (!dayDate) return 0;
    return kpiAlveolesFermeAt(
      state.productions,
      state.transferts,
      cap,
      dayDate
    );
  }, [dayDate, state.productions, state.transferts, cap]);

  const misesEnVenteAlv = React.useMemo(() => {
    if (!dayDate) return 0;
    const dayStart = startOfDay(dayDate);
    const prod = state.productions.find(
      (p) =>
        p.statut === "actif" &&
        isSameDay(startOfDay(new Date(p.jourISO)), dayStart)
    );
    if (!prod || prod.envoyesVente <= 0) return 0;
    return eggsToTrays(prod.envoyesVente, cap);
  }, [dayDate, state.productions, cap]);

  const apresAlv = Math.max(0, stockDispoAlv - alveoles);
  const overLimit = alveoles > stockDispoAlv;

  const quantiteError =
    touched && alveoles <= 0
      ? "Indiquez au moins 1 alvéole."
      : touched && overLimit
        ? `${KPI_LABEL.stockFerme} insuffisant. Disponible : ${stockDispoAlv} alv.`
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
        contentClassName={DIALOG_COMPACT_MAX}
        previewBarClassName="py-1.5"
        title={ACTION_LABEL.envoyerEnVente}
        onSubmit={handleSubmit}
        body={
          <DialogScrollRegion className={cn(DIALOG_SCROLL, "space-y-3")}>
            <StoreErrorBanner error={state.errors} />
            <SendStockPathWarning
              misesEnVenteAlv={misesEnVenteAlv}
              stockDispoAlv={stockDispoAlv}
            />
            <p className="text-label leading-snug text-muted">
              Transfert manuel vers les ventes, sans nouvelle collecte ce jour-là.
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
              hint={UNIT_ALVEOLES}
            >
              <div className="relative w-full max-w-[7.5rem]">
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
                className={cn(FORM_INPUT_NOTES, "max-h-16 resize-none")}
              />
            </FormField>
          </DialogScrollRegion>
        }
        preview={
          <StockFermePreviewBar
            stockDispoAlv={stockDispoAlv}
            apresAlv={apresAlv}
            overLimit={overLimit}
          />
        }
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={unsaved.requestClose}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
              <ArrowRight className="h-4 w-4" />
              {ACTION_LABEL.envoyerEnVente}
            </Button>
          </>
        }
      />

      <UnsavedChangesConfirm {...unsaved.confirmDialogProps} />
    </>
  );
}
