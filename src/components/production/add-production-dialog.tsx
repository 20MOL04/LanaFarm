"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { ShoppingCart, TrendingDown, Warehouse } from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { FormField } from "@/components/shared/form-field";
import { CompactNumberField } from "@/components/shared/compact-number-field";
import { DialogDateRow } from "@/components/shared/dialog-date-row";
import { DialogFormShell } from "@/components/shared/dialog-form-shell";
import { MultiDayConflictDialog } from "@/components/shared/multi-day-conflict-dialog";
import { MultiDayModeToggle } from "@/components/shared/multi-day-mode-toggle";
import { MultiDayPeriodPicker } from "@/components/shared/multi-day-period-picker";
import { ProductionPreviewPanel } from "@/components/shared/production-preview-panel";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import {
  DIALOG_SCROLL,
  FORM_INPUT_NOTES,
  FORM_NUM_FIELDS_ROW,
} from "@/components/shared/form-dialog-styles";
import { Button } from "@/components/ui/button";
import { DialogScrollRegion } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDateRange } from "@/contexts/date-range-context";
import { useFarmConfig, useProductionStore, useTransfersStore } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import {
  type ProductionUiDraft,
  type ProductionFormErrors,
  productionUiToStorageDraft,
  validateProductionUiDraft,
} from "@/lib/production-calc";
import { computeProductionPreview } from "@/lib/production-preview";
import { FIELD_LABEL, FIELD_HINT, eggsToTrays } from "@/lib/terminology";
import {
  clampMultiDayPeriod,
  enumerateDayISOs,
  findActiveProductionForDay,
  syncLinesWithPeriod,
  type MultiDayConflictResolution,
} from "@/lib/multi-day";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import {
  isProductionMultiLineFilled,
  ProductionMultiDayForm,
  type ProductionMultiDayLine,
} from "@/components/production/production-multi-day-form";
import type { Production } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Production | null;
};

const todayIso = () => format(startOfDay(new Date()), "yyyy-MM-dd");

function emptyDraft(): ProductionUiDraft {
  return {
    jourISO: todayIso(),
    alveolesRamassees: 0,
    alveolesMisesEnVente: 0,
    oeufsCasses: 0,
    notes: "",
  };
}

function draftFromProduction(entry: Production, cap: number): ProductionUiDraft {
  const d = new Date(entry.jourISO);
  const jourISO = Number.isNaN(d.getTime())
    ? todayIso()
    : format(startOfDay(d), "yyyy-MM-dd");
  return {
    jourISO,
    alveolesRamassees: eggsToTrays(entry.production, cap),
    alveolesMisesEnVente: eggsToTrays(entry.envoyesVente, cap),
    oeufsCasses: entry.casses,
    notes: entry.notes ?? "",
  };
}

function emptyProductionMultiLine(jourISO: string): ProductionMultiDayLine {
  return {
    jourISO,
    alveolesRamassees: 0,
    alveolesMisesEnVente: 0,
    oeufsCasses: 0,
  };
}

export function AddProductionDialog({ open, onOpenChange, editEntry = null }: Props) {
  const { addProduction, updateProduction, state, clearError } = useProductionStore();
  const { getAllTransfers } = useTransfersStore();
  const { range } = useDateRange();
  const isEditMode = !!editEntry;
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const [draft, setDraft] = React.useState<ProductionUiDraft>(emptyDraft);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [multiMode, setMultiMode] = React.useState(false);
  const [periodFrom, setPeriodFrom] = React.useState(todayIso);
  const [periodTo, setPeriodTo] = React.useState(todayIso);
  const [multiLines, setMultiLines] = React.useState<ProductionMultiDayLine[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [conflictDays, setConflictDays] = React.useState<string[]>([]);
  const pendingMultiRef = React.useRef<ProductionMultiDayLine[]>([]);
  const openSnapshotRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      openSnapshotRef.current = null;
      return;
    }
    const rawFrom = format(startOfDay(range.from), "yyyy-MM-dd");
    const rawTo = format(startOfDay(range.to), "yyyy-MM-dd");
    const { fromIso, toIso } = clampMultiDayPeriod(rawFrom, rawTo, todayIso());
    const days = enumerateDayISOs(fromIso, toIso);
    const lines = days.map(emptyProductionMultiLine);
    const initialDraft = editEntry
      ? draftFromProduction(editEntry, cap)
      : emptyDraft();

    setDraft(initialDraft);
    setTouched({});
    setMultiMode(false);
    setPeriodFrom(fromIso);
    setPeriodTo(toIso);
    setMultiLines(lines);
    setConflictOpen(false);
    setConflictDays([]);
    pendingMultiRef.current = [];
    clearError();

    openSnapshotRef.current = stableStringify(
      productionFormComparable({
        isEditMode: !!editEntry,
        draft: initialDraft,
        multiMode: false,
        periodFrom: fromIso,
        periodTo: toIso,
        multiLines: lines,
      })
    );
  }, [open, editEntry, cap, clearError, range.from, range.to]);

  const formComparable = React.useMemo(
    () =>
      productionFormComparable({
        isEditMode,
        draft,
        multiMode,
        periodFrom,
        periodTo,
        multiLines,
      }),
    [isEditMode, draft, multiMode, periodFrom, periodTo, multiLines]
  );

  const isDirty = isDirtyComparedToSnapshot(formComparable, openSnapshotRef.current);

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

  const errors: ProductionFormErrors = React.useMemo(
    () => validateProductionUiDraft(draft, cap),
    [draft, cap]
  );

  const dayDate = React.useMemo(() => {
    if (!draft.jourISO) return null;
    const d = new Date(draft.jourISO);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [draft.jourISO]);

  const preview = React.useMemo(() => {
    const transferts = getAllTransfers();
    if (multiMode && !isEditMode) {
      return computeProductionPreview(state.productions, transferts, cap, {
        mode: "multi",
        lines: multiLines,
      });
    }
    return computeProductionPreview(state.productions, transferts, cap, {
      mode: "day",
      draft,
      dayDate,
      editEntryId: editEntry?.id,
    });
  }, [
    multiMode,
    isEditMode,
    multiLines,
    draft,
    dayDate,
    editEntry?.id,
    state.productions,
    getAllTransfers,
    cap,
  ]);

  const hasErrors = Object.keys(errors).length > 0;

  const multiDayISOs = React.useMemo(
    () => enumerateDayISOs(periodFrom, periodTo),
    [periodFrom, periodTo]
  );

  React.useEffect(() => {
    if (!multiMode) return;
    setMultiLines((prev) =>
      syncLinesWithPeriod(prev, multiDayISOs, emptyProductionMultiLine)
    );
  }, [multiMode, multiDayISOs]);

  const filledMultiLines = React.useMemo(
    () => multiLines.filter(isProductionMultiLineFilled),
    [multiLines]
  );

  const canSubmitMulti = multiDayISOs.length > 0 && filledMultiLines.length > 0;

  const multiLineToPayload = React.useCallback(
    (line: ProductionMultiDayLine) => {
      const storage = productionUiToStorageDraft(
        {
          jourISO: line.jourISO,
          alveolesRamassees: line.alveolesRamassees,
          alveolesMisesEnVente: line.alveolesMisesEnVente,
          oeufsCasses: line.oeufsCasses,
          notes: "",
        },
        cap
      );
      return {
        jourISO: startOfDay(new Date(line.jourISO)).toISOString(),
        production: storage.production,
        casses: storage.casses,
        envoyesVente: storage.envoyesVente,
      };
    },
    [cap]
  );

  const persistMultiLines = React.useCallback(
    (lines: ProductionMultiDayLine[], resolution: MultiDayConflictResolution | null) => {
      clearError();
      runSubmit(() => {
        for (const line of lines) {
          const existing = findActiveProductionForDay(state.productions, line.jourISO);
          if (existing) {
            if (resolution === "ignore") continue;
            updateProduction(existing.id, multiLineToPayload(line));
          } else {
            addProduction(multiLineToPayload(line));
          }
        }
      });
    },
    [
      addProduction,
      updateProduction,
      clearError,
      runSubmit,
      state.productions,
      multiLineToPayload,
    ]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (multiMode && !isEditMode) {
      if (!canSubmitMulti) return;
      const conflicts = filledMultiLines
        .filter((line) => findActiveProductionForDay(state.productions, line.jourISO))
        .map((line) => line.jourISO);
      if (conflicts.length > 0) {
        pendingMultiRef.current = filledMultiLines;
        setConflictDays(conflicts);
        setConflictOpen(true);
        return;
      }
      persistMultiLines(filledMultiLines, null);
      return;
    }

    setTouched({
      jourISO: true,
      alveolesRamassees: true,
      alveolesMisesEnVente: true,
      oeufsCasses: true,
    });
    if (hasErrors || !dayDate) return;

    const storage = productionUiToStorageDraft(draft, cap);
    const payload = {
      jourISO: dayDate.toISOString(),
      production: storage.production,
      casses: storage.casses,
      envoyesVente: storage.envoyesVente,
      notes: storage.notes?.trim() ? storage.notes.trim() : undefined,
    };
    clearError();
    runSubmit(() => {
      if (isEditMode && editEntry) {
        updateProduction(editEntry.id, payload);
      } else {
        addProduction(payload);
      }
    });
  };

  const modeToggle = !isEditMode ? (
    <MultiDayModeToggle multiMode={multiMode} onToggle={() => setMultiMode((m) => !m)} />
  ) : null;

  return (
    <>
      <DialogFormShell
        open={open}
        onOpenChange={unsaved.dialogProps.onOpenChange}
        title={isEditMode ? "Modifier la production" : "Nouvelle production"}
        onSubmit={handleSubmit}
        body={
          <>
            {multiMode && !isEditMode ? (
              <>
                <DialogDateRow toggle={modeToggle}>
                  <MultiDayPeriodPicker
                    fromIso={periodFrom}
                    toIso={periodTo}
                    onFromChange={setPeriodFrom}
                    onToChange={setPeriodTo}
                    maxDateIso={todayIso()}
                  />
                </DialogDateRow>
                <DialogScrollRegion className={DIALOG_SCROLL}>
                  <ProductionMultiDayForm
                    lines={multiLines}
                    productions={state.productions}
                    onChange={setMultiLines}
                  />
                </DialogScrollRegion>
              </>
            ) : (
              <DialogScrollRegion className={DIALOG_SCROLL}>
                <div className="w-full space-y-3">
                  <DialogDateRow toggle={modeToggle}>
                    <FormField
                      label="Jour"
                      htmlFor="prod-day"
                      required
                      error={touched.jourISO ? errors.jourISO : undefined}
                      hint={dayDate ? formatDay(dayDate) : undefined}
                    >
                      <DateInput
                        id="prod-day"
                        value={draft.jourISO}
                        max={todayIso()}
                        onChange={(e) => setDraft((d) => ({ ...d, jourISO: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, jourISO: true }))}
                        required
                      />
                    </FormField>
                  </DialogDateRow>

                  <div className={FORM_NUM_FIELDS_ROW}>
                    <CompactNumberField
                      id="prod-ramassees"
                      label={FIELD_LABEL.ramassees}
                      hint={FIELD_HINT.quantiteAlveoles}
                      icon={<Warehouse className="h-4 w-4 text-accent-blue" />}
                      value={draft.alveolesRamassees}
                      onChange={(v) => setDraft((d) => ({ ...d, alveolesRamassees: v }))}
                      onBlur={() => setTouched((t) => ({ ...t, alveolesRamassees: true }))}
                      error={touched.alveolesRamassees ? errors.alveolesRamassees : undefined}
                      required
                    />
                    <CompactNumberField
                      id="prod-mises"
                      label={FIELD_LABEL.misesEnVente}
                      hint={FIELD_HINT.quantiteAlveoles}
                      icon={<ShoppingCart className="h-4 w-4 text-info" />}
                      value={draft.alveolesMisesEnVente}
                      onChange={(v) => setDraft((d) => ({ ...d, alveolesMisesEnVente: v }))}
                      onBlur={() => setTouched((t) => ({ ...t, alveolesMisesEnVente: true }))}
                      error={
                        touched.alveolesMisesEnVente ? errors.alveolesMisesEnVente : undefined
                      }
                    />
                    <CompactNumberField
                      id="prod-casses"
                      label="Œufs cassés"
                      hint="En œufs"
                      icon={<TrendingDown className="h-4 w-4 text-danger" />}
                      value={draft.oeufsCasses}
                      onChange={(v) => setDraft((d) => ({ ...d, oeufsCasses: v }))}
                      onBlur={() => setTouched((t) => ({ ...t, oeufsCasses: true }))}
                      error={touched.oeufsCasses ? errors.oeufsCasses : undefined}
                    />
                  </div>

                  <FormField label="Notes (optionnel)" htmlFor="prod-notes">
                    <Input
                      id="prod-notes"
                      type="text"
                      value={draft.notes ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Optionnel"
                      className={FORM_INPUT_NOTES}
                    />
                  </FormField>
                </div>
              </DialogScrollRegion>
            )}
            <StoreErrorBanner error={state.errors} />
          </>
        }
        preview={
          <ProductionPreviewPanel
            restantesJour={preview.restantesJour}
            stockAvant={preview.stockAvant}
            stockApres={preview.stockApres}
            restantesLabel={preview.restantesLabel}
          />
        }
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={unsaved.requestClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={
                multiMode && !isEditMode ? !canSubmitMulti : hasErrors || !dayDate
              }
            >
              {isEditMode ? "Enregistrer les modifications" : "Enregistrer"}
            </Button>
          </>
        }
      />

      <MultiDayConflictDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        conflictDays={conflictDays}
        onResolve={(resolution) => {
          const lines =
            pendingMultiRef.current.length > 0
              ? pendingMultiRef.current
              : filledMultiLines;
          pendingMultiRef.current = [];
          persistMultiLines(lines, resolution);
        }}
      />

      <UnsavedChangesConfirm {...unsaved.confirmDialogProps} />
    </>
  );
}

type ProductionFormComparable =
  | { mode: "edit"; draft: ProductionUiDraft }
  | { mode: "day"; draft: ProductionUiDraft }
  | {
      mode: "multi";
      periodFrom: string;
      periodTo: string;
      multiLines: ProductionMultiDayLine[];
    };

function productionFormComparable(input: {
  isEditMode: boolean;
  draft: ProductionUiDraft;
  multiMode: boolean;
  periodFrom: string;
  periodTo: string;
  multiLines: ProductionMultiDayLine[];
}): ProductionFormComparable {
  if (input.isEditMode) {
    return { mode: "edit", draft: input.draft };
  }
  if (input.multiMode) {
    return {
      mode: "multi",
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      multiLines: input.multiLines,
    };
  }
  return { mode: "day", draft: input.draft };
}
