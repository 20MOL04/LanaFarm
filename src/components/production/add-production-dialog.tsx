"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import {
  PackageCheck,
  ShoppingCart,
  TrendingDown,
  Warehouse,
} from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { FormField } from "@/components/shared/form-field";
import { MultiDayConflictDialog } from "@/components/shared/multi-day-conflict-dialog";
import { MultiDayModeToggle } from "@/components/shared/multi-day-mode-toggle";
import { MultiDayPeriodPicker } from "@/components/shared/multi-day-period-picker";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDateRange } from "@/contexts/date-range-context";
import { useFarmConfig, useProductionStore, useTransfersStore } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { formatNumber } from "@/lib/format";
import {
  type ProductionUiDraft,
  type ProductionFormErrors,
  calcAlveolesRestantesJour,
  productionUiToStorageDraft,
  validateProductionUiDraft,
} from "@/lib/production-calc";
import { stockFermeDisponiblePourEnvoi } from "@/lib/transfers-calc";
import { FIELD_LABEL, FIELD_HINT, KPI_LABEL, eggsToTrays } from "@/lib/terminology";
import { traysToEggs } from "@/lib/units";
import { cn } from "@/lib/utils";
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
    const eggsProd = traysToEggs(draft.alveolesRamassees, cap);
    const eggsEnv = traysToEggs(draft.alveolesMisesEnVente, cap);
    const restantesJour = calcAlveolesRestantesJour(
      { production: eggsProd, envoyesVente: eggsEnv },
      cap
    );

    const today = new Date();
    const transferts = getAllTransfers();
    const stockAvantOeufs = stockFermeDisponiblePourEnvoi(
      state.productions,
      transferts,
      today
    );

    const storage = productionUiToStorageDraft(draft, cap);
    const jourKey = dayDate ? startOfDay(dayDate).getTime() : null;
    const hasDraftValues =
      draft.alveolesRamassees > 0 || draft.alveolesMisesEnVente > 0;

    let productionsSim = state.productions.filter((p) => p.statut === "actif");
    if (isEditMode && editEntry) {
      productionsSim = productionsSim.map((p) =>
        p.id === editEntry.id
          ? {
              ...p,
              jourISO: dayDate?.toISOString() ?? p.jourISO,
              production: storage.production,
              casses: storage.casses,
              envoyesVente: storage.envoyesVente,
            }
          : p
      );
    } else if (jourKey != null && hasDraftValues) {
      productionsSim = productionsSim.filter(
        (p) => startOfDay(new Date(p.jourISO)).getTime() !== jourKey
      );
      productionsSim = [
        ...productionsSim,
        {
          id: "__preview__",
          jourISO: dayDate!.toISOString(),
          production: storage.production,
          casses: storage.casses,
          envoyesVente: storage.envoyesVente,
          statut: "actif" as const,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }

    const stockApresOeufs = stockFermeDisponiblePourEnvoi(
      productionsSim,
      transferts,
      today
    );

    return {
      restantesJour,
      stockAvant: eggsToTrays(stockAvantOeufs, cap),
      stockApres: eggsToTrays(stockApresOeufs, cap),
    };
  }, [
    draft,
    cap,
    dayDate,
    state.productions,
    getAllTransfers,
    isEditMode,
    editEntry,
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

  return (
    <>
      <Dialog open={open} onOpenChange={unsaved.dialogProps.onOpenChange}>
        <DialogContent className={cn(multiMode && !isEditMode && "sm:max-w-2xl")}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle>
                {isEditMode ? "Modifier la production" : "Nouvelle production"}
              </DialogTitle>
              {!isEditMode ? (
                <MultiDayModeToggle
                  multiMode={multiMode}
                  onToggle={() => setMultiMode((m) => !m)}
                />
              ) : null}
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody className="space-y-3">
              {multiMode && !isEditMode ? (
                <>
                  <MultiDayPeriodPicker
                    fromIso={periodFrom}
                    toIso={periodTo}
                    onFromChange={setPeriodFrom}
                    onToChange={setPeriodTo}
                    maxDateIso={todayIso()}
                    hintRange={range}
                  />
                  <ProductionMultiDayForm
                    lines={multiLines}
                    productions={state.productions}
                    onChange={setMultiLines}
                  />
                </>
              ) : (
                <>
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

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <NumberField
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

              <NumberField
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
            </div>

            <NumberField
              id="prod-casses"
              label="Œufs cassés"
              hint="En œufs — perte ferme, n'affecte pas le stock disponible"
              icon={<TrendingDown className="h-4 w-4 text-danger" />}
              value={draft.oeufsCasses}
              onChange={(v) => setDraft((d) => ({ ...d, oeufsCasses: v }))}
              onBlur={() => setTouched((t) => ({ ...t, oeufsCasses: true }))}
              error={touched.oeufsCasses ? errors.oeufsCasses : undefined}
            />

            <FormField label="Notes (optionnel)" htmlFor="prod-notes">
              <Input
                id="prod-notes"
                type="text"
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Ex : Forte chaleur, baisse de la ponte…"
                className="h-9"
              />
            </FormField>

            <ProductionPreviewPanel
              restantesJour={preview.restantesJour}
              stockAvant={preview.stockAvant}
              stockApres={preview.stockApres}
            />
                </>
              )}

            <StoreErrorBanner error={state.errors} />
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
              disabled={
                multiMode && !isEditMode
                  ? !canSubmitMulti
                  : hasErrors || !dayDate
              }
            >
              {isEditMode ? "Enregistrer les modifications" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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

type NumberFieldProps = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
};

function NumberField({
  id,
  label,
  hint,
  icon,
  value,
  onChange,
  onBlur,
  error,
  required,
}: NumberFieldProps) {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </span>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = parseInt(raw, 10);
            onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
          }}
          onBlur={onBlur}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 pl-9 tabular-nums"
          required={required}
        />
      </div>
    </FormField>
  );
}

function ProductionPreviewPanel({
  restantesJour,
  stockAvant,
  stockApres,
}: {
  restantesJour: number;
  stockAvant: number;
  stockApres: number;
}) {
  const restantesNegative = restantesJour < 0;
  const restantesPositive = restantesJour > 0;
  const delta = stockApres - stockAvant;

  return (
    <div className="space-y-2 rounded-card border border-border bg-card-muted px-3 py-2.5">
      <PreviewRow
        label="Restantes ce jour"
        value={formatNumber(restantesJour)}
        suffix="alv."
        tone={
          restantesNegative ? "danger" : restantesPositive ? "success" : "neutral"
        }
      />
      <div className="border-t border-border pt-2">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {KPI_LABEL.alveolesRestantes}
        </p>
        <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
          <span className="text-muted">{formatNumber(stockAvant)} alv.</span>
          <span className="text-muted">→</span>
          <span
            className={cn(
              "font-semibold",
              delta > 0 && "text-success",
              delta < 0 && "text-danger",
              delta === 0 && "text-foreground"
            )}
          >
            {formatNumber(stockApres)} alv.
          </span>
        </div>
        {delta !== 0 ? (
          <p className="mt-0.5 text-[10px] text-muted tabular-nums">
            {delta > 0 ? "+" : ""}
            {formatNumber(delta)} alv. après enregistrement
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix: string;
  tone: "neutral" | "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <PackageCheck
          className={cn(
            "h-3.5 w-3.5",
            tone === "success" && "text-success",
            tone === "danger" && "text-danger",
            tone === "neutral" && "text-muted"
          )}
        />
        <p className="text-[11px] text-muted">{label}</p>
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value} {suffix}
      </span>
    </div>
  );
}
