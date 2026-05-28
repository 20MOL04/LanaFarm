"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import {
  Plus,
  ShoppingBag,
  Trash2,
  TrendingDown,
  UserRound,
} from "lucide-react";

import { PriceSelect } from "@/components/sales/price-select";
import {
  isSalesMultiLineFilled,
  SalesMultiDayForm,
  type SalesMultiDayLine,
} from "@/components/sales/sales-multi-day-form";
import { DateInput } from "@/components/shared/date-input";
import { FormField } from "@/components/shared/form-field";
import { MultiDayConflictDialog } from "@/components/shared/multi-day-conflict-dialog";
import { MultiDayModeToggle } from "@/components/shared/multi-day-mode-toggle";
import { MultiDayPeriodPicker } from "@/components/shared/multi-day-period-picker";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
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
import { useDateRange } from "@/contexts/date-range-context";
import {
  useFarmConfig,
  useSalesStore,
  useTransfersStore,
} from "@/contexts/farm-store";
import { StockPreviewPanel } from "@/components/shared/stock-preview-panel";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF, formatNumber } from "@/lib/format";
import { computeSalesPreview } from "@/lib/sales-preview";
import {
  type SaleDayUiDraft,
  type SaleDayFormErrors,
  type SaleFormErrors,
  type SaleLineUiDraft,
  calcSaleLineMontant,
  saleDayUiToStorageDrafts,
  validateSaleDayUiDraft,
  validateSaleDraftWithCumulativeStock,
} from "@/lib/sales-calc";
import { SALES_LABEL, eggsToTrays } from "@/lib/terminology";
import { traysToEggs } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  clampMultiDayPeriod,
  enumerateDayISOs,
  getActiveVentesForDay,
  syncLinesWithPeriod,
  type MultiDayConflictResolution,
} from "@/lib/multi-day";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import type { Vente } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Vente | null;
};

/** État UI — cassés saisis en alvéoles (convertis en œufs à l'enregistrement). */
type SaleDayFormState = {
  jourISO: string;
  lignes: SaleLineUiDraft[];
  cassesAlveoles: number;
};

type SaleEditFormState = {
  jourISO: string;
  alveoles: number;
  prix: number;
  cassesAlveoles: number;
  client: string;
};

const todayIso = () => format(startOfDay(new Date()), "yyyy-MM-dd");

function emptyLine(defaultPrix: number): SaleLineUiDraft {
  return { alveoles: 0, prix: defaultPrix, client: "" };
}

function emptyDayDraft(defaultPrix: number): SaleDayFormState {
  return {
    jourISO: todayIso(),
    lignes: [emptyLine(defaultPrix)],
    cassesAlveoles: 0,
  };
}

function toSaleDayDraft(state: SaleDayFormState, cap: number): SaleDayUiDraft {
  return {
    jourISO: state.jourISO,
    lignes: state.lignes,
    oeufsCasses: traysToEggs(state.cassesAlveoles, cap),
  };
}

function emptyEditState(defaultPrix: number): SaleEditFormState {
  return {
    jourISO: todayIso(),
    alveoles: 0,
    prix: defaultPrix,
    cassesAlveoles: 0,
    client: "",
  };
}

function editStateFromVente(
  entry: Vente,
  cap: number,
  defaultPrix: number
): SaleEditFormState {
  const d = new Date(entry.jourISO);
  const jourISO = Number.isNaN(d.getTime())
    ? todayIso()
    : format(startOfDay(d), "yyyy-MM-dd");
  return {
    jourISO,
    alveoles: eggsToTrays(entry.vendus, cap),
    prix: entry.prix > 0 ? entry.prix : defaultPrix,
    cassesAlveoles: eggsToTrays(entry.cassesVente, cap),
    client: entry.client ?? "",
  };
}

function emptySalesMultiLine(jourISO: string, defaultPrix: number): SalesMultiDayLine {
  return {
    jourISO,
    alveoles: 0,
    prix: defaultPrix,
    client: "",
    cassesAlveoles: 0,
  };
}

export function AddSaleDialog({ open, onOpenChange, editEntry = null }: Props) {
  const {
    state: salesState,
    addSalesDay,
    updateSale,
    cancelSale,
    clearError,
  } = useSalesStore();
  const { getAllTransfers } = useTransfersStore();
  const { range } = useDateRange();
  const config = useFarmConfig();
  const defaultPrix = config.preferences.prixPlateauGNF;
  const cap = config.preferences.capacitePlateau;
  const isEditMode = !!editEntry;

  const [draft, setDraft] = React.useState<SaleDayFormState>(() => emptyDayDraft(defaultPrix));
  const [editDraft, setEditDraft] = React.useState<SaleEditFormState>(() =>
    emptyEditState(defaultPrix)
  );
  const [touched, setTouched] = React.useState(false);
  const [multiMode, setMultiMode] = React.useState(false);
  const [periodFrom, setPeriodFrom] = React.useState(todayIso);
  const [periodTo, setPeriodTo] = React.useState(todayIso);
  const [multiLines, setMultiLines] = React.useState<SalesMultiDayLine[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [conflictDays, setConflictDays] = React.useState<string[]>([]);
  const pendingMultiRef = React.useRef<SalesMultiDayLine[]>([]);
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
    const lines = days.map((d) => emptySalesMultiLine(d, defaultPrix));
    const edit = editEntry
      ? editStateFromVente(editEntry, cap, defaultPrix)
      : null;
    const day = emptyDayDraft(defaultPrix);

    if (edit) {
      setEditDraft(edit);
    } else {
      setDraft(day);
    }
    setTouched(false);
    setMultiMode(false);
    setPeriodFrom(fromIso);
    setPeriodTo(toIso);
    setMultiLines(lines);
    setConflictOpen(false);
    setConflictDays([]);
    pendingMultiRef.current = [];
    clearError();

    openSnapshotRef.current = stableStringify(
      salesFormComparable({
        isEditMode: !!edit,
        editDraft: edit ?? emptyEditState(defaultPrix),
        dayDraft: day,
        multiMode: false,
        periodFrom: fromIso,
        periodTo: toIso,
        multiLines: lines,
      })
    );
  }, [open, editEntry, defaultPrix, cap, clearError, range.from, range.to]);

  const formComparable = React.useMemo(
    () =>
      salesFormComparable({
        isEditMode,
        editDraft,
        dayDraft: draft,
        multiMode,
        periodFrom,
        periodTo,
        multiLines,
      }),
    [
      isEditMode,
      editDraft,
      draft,
      multiMode,
      periodFrom,
      periodTo,
      multiLines,
    ]
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
  const runSubmit = useStoreSubmitGuard(salesState.errors, closeDialog);

  const activeJourISO = isEditMode ? editDraft.jourISO : draft.jourISO;

  const dayDate = React.useMemo(() => {
    if (!activeJourISO) return null;
    const d = new Date(activeJourISO);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [activeJourISO]);

  const dayValidation = React.useMemo(() => {
    if (isEditMode || !dayDate) return null;
    return validateSaleDayUiDraft(
      toSaleDayDraft(draft, cap),
      {
        transferts: getAllTransfers(),
        toutesVentes: salesState.ventes,
      },
      cap
    );
  }, [isEditMode, draft, dayDate, getAllTransfers, salesState.ventes, cap]);

  const editValidation = React.useMemo(() => {
    if (!isEditMode || !dayDate) return null;
    const vendus = traysToEggs(editDraft.alveoles, cap);
    const cassesEggs = traysToEggs(editDraft.cassesAlveoles, cap);
    const result = validateSaleDraftWithCumulativeStock(
      {
        jourISO: dayDate.toISOString(),
        vendus,
        cassesVente: cassesEggs,
        prix: editDraft.prix,
        client: editDraft.client.trim() || undefined,
      },
      {
        transferts: getAllTransfers(),
        toutesVentes: salesState.ventes,
        excludeSaleId: editEntry?.id,
      }
    );
    return {
      errors: result.errors,
      stockDisponible: result.stockDisponible,
      stockApres: result.stockDisponible - vendus - cassesEggs,
      montantTotal: calcSaleLineMontant(vendus, editDraft.prix, cap),
      alveolesTotales: editDraft.alveoles,
    };
  }, [
    isEditMode,
    editDraft,
    dayDate,
    getAllTransfers,
    salesState.ventes,
    cap,
    editEntry?.id,
  ]);

  const dayPreview = React.useMemo(
    () =>
      computeSalesPreview(salesState.ventes, getAllTransfers(), cap, {
        mode: "day",
        dayDate,
        lignes: draft.lignes,
        cassesAlveoles: draft.cassesAlveoles,
      }),
    [salesState.ventes, getAllTransfers, cap, dayDate, draft.lignes, draft.cassesAlveoles]
  );

  const multiPreview = React.useMemo(
    () =>
      multiMode && !isEditMode
        ? computeSalesPreview(salesState.ventes, getAllTransfers(), cap, {
            mode: "multi",
            lines: multiLines,
          })
        : null,
    [multiMode, isEditMode, multiLines, salesState.ventes, getAllTransfers, cap]
  );

  const editErrors: SaleFormErrors = editValidation?.errors ?? {};
  const dayErrors: SaleDayFormErrors = dayValidation?.errors ?? {};

  const hasActiveLine = isEditMode
    ? editDraft.alveoles > 0 && editDraft.prix > 0
    : draft.lignes.some((l) => l.alveoles > 0 && l.prix > 0);

  const hasErrors = isEditMode
    ? Object.keys(editErrors).length > 0
    : Object.keys(dayErrors).length > 0;

  const canSubmit =
    !!dayDate &&
    hasActiveLine &&
    !hasErrors &&
    !(dayPreview?.stockNegatif ?? false);

  const multiDayISOs = React.useMemo(
    () => enumerateDayISOs(periodFrom, periodTo),
    [periodFrom, periodTo]
  );

  React.useEffect(() => {
    if (!multiMode) return;
    setMultiLines((prev) =>
      syncLinesWithPeriod(prev, multiDayISOs, (jourISO) =>
        emptySalesMultiLine(jourISO, defaultPrix)
      )
    );
  }, [multiMode, multiDayISOs, defaultPrix]);

  const filledMultiLines = React.useMemo(
    () => multiLines.filter(isSalesMultiLineFilled),
    [multiLines]
  );

  const canSubmitMulti =
    multiDayISOs.length > 0 &&
    filledMultiLines.length > 0 &&
    !(multiPreview?.stockNegatif ?? false);

  const multiLineToStorageDrafts = React.useCallback(
    (line: SalesMultiDayLine) =>
      saleDayUiToStorageDrafts(
        {
          jourISO: startOfDay(new Date(line.jourISO)).toISOString(),
          lignes: [{ alveoles: line.alveoles, prix: line.prix, client: line.client }],
          oeufsCasses: traysToEggs(line.cassesAlveoles, cap),
        },
        cap
      ),
    [cap]
  );

  const persistMultiLines = React.useCallback(
    (lines: SalesMultiDayLine[], resolution: MultiDayConflictResolution | null) => {
      clearError();
      runSubmit(() => {
        for (const line of lines) {
          const existing = getActiveVentesForDay(salesState.ventes, line.jourISO);
          const drafts = multiLineToStorageDrafts(line);
          if (existing.length > 0) {
            if (resolution === "ignore") continue;
            for (const sale of existing) {
              cancelSale(sale.id);
            }
            addSalesDay(drafts);
          } else {
            addSalesDay(drafts);
          }
        }
      });
    },
    [
      addSalesDay,
      cancelSale,
      clearError,
      runSubmit,
      salesState.ventes,
      multiLineToStorageDrafts,
    ]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (multiMode && !isEditMode) {
      if (!canSubmitMulti) return;
      const conflicts = filledMultiLines
        .filter((line) => getActiveVentesForDay(salesState.ventes, line.jourISO).length > 0)
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

    setTouched(true);
    if (!canSubmit || !dayDate) return;

    clearError();
    runSubmit(() => {
      if (isEditMode && editEntry) {
        updateSale(editEntry.id, {
          jourISO: dayDate.toISOString(),
          vendus: traysToEggs(editDraft.alveoles, cap),
          cassesVente: traysToEggs(editDraft.cassesAlveoles, cap),
          prix: editDraft.prix,
          client: editDraft.client.trim() || undefined,
        });
      } else {
        const storageDrafts = saleDayUiToStorageDrafts(
          toSaleDayDraft({ ...draft, jourISO: dayDate.toISOString() }, cap),
          cap
        );
        addSalesDay(storageDrafts);
      }
    });
  };

  const updateLine = (index: number, patch: Partial<SaleLineUiDraft>) => {
    setDraft((d) => ({
      ...d,
      lignes: d.lignes.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  };

  const addLine = () => {
    setDraft((d) => ({
      ...d,
      lignes: [...d.lignes, emptyLine(defaultPrix)],
    }));
  };

  const removeLine = (index: number) => {
    setDraft((d) => ({
      ...d,
      lignes: d.lignes.length <= 1 ? d.lignes : d.lignes.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={unsaved.dialogProps.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle>
                {isEditMode ? "Modifier la vente" : "Ventes du jour"}
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
                  <SalesMultiDayForm
                    lines={multiLines}
                    ventes={salesState.ventes}
                    defaultPrix={defaultPrix}
                    onChange={setMultiLines}
                  />
                  {multiPreview ? (
                    <StockPreviewPanel
                      stockDisponible={multiPreview.stockDisponibleAlv}
                      stockApres={multiPreview.stockApresAlv}
                      montant={multiPreview.montantTotal}
                      stockNegatif={multiPreview.stockNegatif}
                      deltaAlv={multiPreview.deltaAlv}
                      caLabel={multiPreview.caLabel}
                    />
                  ) : null}
                </>
              ) : (
                <>
            <FormField
              label="Jour"
              htmlFor="sale-day"
              required
              error={
                touched
                  ? isEditMode
                    ? editErrors.jourISO
                    : dayErrors.jourISO
                  : undefined
              }
              hint={dayDate ? formatDay(dayDate) : undefined}
            >
              <DateInput
                id="sale-day"
                value={isEditMode ? editDraft.jourISO : draft.jourISO}
                max={todayIso()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isEditMode) {
                    setEditDraft((d) => ({ ...d, jourISO: v }));
                  } else {
                    setDraft((d) => ({ ...d, jourISO: v }));
                  }
                }}
                required
              />
            </FormField>

            {isEditMode ? (
              <SaleLineCard
                alveoles={editDraft.alveoles}
                prix={editDraft.prix}
                client={editDraft.client}
                defaultPrix={defaultPrix}
                onAlveolesChange={(v) => setEditDraft((d) => ({ ...d, alveoles: v }))}
                onPrixChange={(v) => setEditDraft((d) => ({ ...d, prix: v }))}
                onClientChange={(v) => setEditDraft((d) => ({ ...d, client: v }))}
                errors={
                  touched
                    ? {
                        alveoles: editErrors.vendus,
                        prix: editErrors.prix,
                      }
                    : undefined
                }
                showDelete={false}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Lignes de vente
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>

                {draft.lignes.map((ligne, index) => (
                  <SaleLineCard
                    key={index}
                    alveoles={ligne.alveoles}
                    prix={ligne.prix}
                    client={ligne.client ?? ""}
                    defaultPrix={defaultPrix}
                    onAlveolesChange={(v) => updateLine(index, { alveoles: v })}
                    onPrixChange={(v) => updateLine(index, { prix: v })}
                    onClientChange={(v) => updateLine(index, { client: v })}
                    errors={
                      touched ? dayErrors.lignes?.[index] : undefined
                    }
                    onDelete={() => removeLine(index)}
                    deleteDisabled={draft.lignes.length <= 1}
                  />
                ))}

                {touched && dayErrors.form ? (
                  <p className="text-[11px] text-danger">{dayErrors.form}</p>
                ) : null}
              </div>
            )}

            <FormField
              label="Cassés vente (stock magasin uniquement)"
              htmlFor="sale-casses"
              hint="Alvéoles endommagées chez le vendeur"
              error={touched ? (isEditMode ? editErrors.cassesVente : dayErrors.oeufsCasses) : undefined}
            >
              <div className="relative max-w-[140px]">
                <TrendingDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-danger" />
                <Input
                  id="sale-casses"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={isEditMode ? editDraft.cassesAlveoles : draft.cassesAlveoles}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    const v =
                      raw === ""
                        ? 0
                        : (() => {
                            const n = parseInt(raw, 10);
                            return Number.isNaN(n) ? 0 : Math.max(0, n);
                          })();
                    if (isEditMode) {
                      setEditDraft((d) => ({ ...d, cassesAlveoles: v }));
                    } else {
                      setDraft((d) => ({ ...d, cassesAlveoles: v }));
                    }
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  className="pl-9 tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">
                  alv.
                </span>
              </div>
            </FormField>

            {isEditMode && editValidation ? (
              <StockPreviewPanel
                stockDisponible={eggsToTrays(editValidation.stockDisponible, cap)}
                stockApres={eggsToTrays(Math.max(0, editValidation.stockApres), cap)}
                montant={editValidation.montantTotal}
                stockNegatif={editValidation.stockApres < 0}
              />
            ) : null}

            {!isEditMode && dayPreview ? (
              <StockPreviewPanel
                stockDisponible={dayPreview.stockDisponibleAlv}
                stockApres={dayPreview.stockApresAlv}
                montant={dayPreview.montantTotal}
                stockNegatif={dayPreview.stockNegatif}
                deltaAlv={dayPreview.deltaAlv}
                caLabel={dayPreview.caLabel}
              />
            ) : null}

                </>
              )}

            <StoreErrorBanner error={salesState.errors} />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={unsaved.requestClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={multiMode && !isEditMode ? !canSubmitMulti : !canSubmit}
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

type SalesFormComparable =
  | { mode: "edit"; editDraft: SaleEditFormState }
  | { mode: "day"; dayDraft: SaleDayFormState }
  | {
      mode: "multi";
      periodFrom: string;
      periodTo: string;
      multiLines: SalesMultiDayLine[];
    };

function salesFormComparable(input: {
  isEditMode: boolean;
  editDraft: SaleEditFormState;
  dayDraft: SaleDayFormState;
  multiMode: boolean;
  periodFrom: string;
  periodTo: string;
  multiLines: SalesMultiDayLine[];
}): SalesFormComparable {
  if (input.isEditMode) {
    return { mode: "edit", editDraft: input.editDraft };
  }
  if (input.multiMode) {
    return {
      mode: "multi",
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      multiLines: input.multiLines,
    };
  }
  return { mode: "day", dayDraft: input.dayDraft };
}

function SaleLineCard({
  alveoles,
  prix,
  client,
  defaultPrix,
  onAlveolesChange,
  onPrixChange,
  onClientChange,
  errors,
  onDelete,
  deleteDisabled,
  showDelete = true,
}: {
  alveoles: number;
  prix: number;
  client: string;
  defaultPrix: number;
  onAlveolesChange: (v: number) => void;
  onPrixChange: (v: number) => void;
  onClientChange: (v: string) => void;
  errors?: { alveoles?: string; prix?: string };
  onDelete?: () => void;
  deleteDisabled?: boolean;
  showDelete?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-card border border-border bg-card-muted p-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField
          label="Qté vendues"
          htmlFor={`alv-${alveoles}-${prix}`}
          required
          error={errors?.alveoles}
          hint="alvéoles"
        >
          <div className="relative">
            <ShoppingBag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={Number.isFinite(alveoles) ? alveoles : 0}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === "") {
                  onAlveolesChange(0);
                  return;
                }
                const n = parseInt(raw, 10);
                onAlveolesChange(Number.isNaN(n) ? 0 : Math.max(0, n));
              }}
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 pl-9 tabular-nums"
            />
          </div>
        </FormField>

        <FormField
          label={SALES_LABEL.prixCasier}
          htmlFor={`prix-${alveoles}-${prix}`}
          required={alveoles > 0}
          error={errors?.prix}
        >
          <PriceSelect
            value={prix}
            onChange={onPrixChange}
            defaultPrix={defaultPrix}
            required={alveoles > 0}
          />
        </FormField>
      </div>

      <div className="flex items-end gap-2">
        <FormField
          label="Client (optionnel)"
          htmlFor={`client-${alveoles}`}
          className="min-w-0 flex-1"
        >
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Ex : Marché Madina"
              value={client}
              onChange={(e) => onClientChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </FormField>
        {showDelete && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mb-0.5 shrink-0"
            onClick={onDelete}
            disabled={deleteDisabled}
            title="Supprimer la ligne"
          >
            <Trash2 className="h-4 w-4 text-muted" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
