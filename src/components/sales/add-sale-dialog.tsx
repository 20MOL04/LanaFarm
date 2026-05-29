"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import {
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";

import { PriceSelect } from "@/components/sales/price-select";
import {
  emptySalesMultiBlock,
  isSalesBlockFilled,
  SalesMultiDayForm,
  type SalesMultiDayBlock,
} from "@/components/sales/sales-multi-day-form";
import { DateInput } from "@/components/shared/date-input";
import { FormField } from "@/components/shared/form-field";
import { DialogDayLinesToolbar } from "@/components/shared/dialog-day-lines-toolbar";
import { DialogDateRow } from "@/components/shared/dialog-date-row";
import { DialogFormShell } from "@/components/shared/dialog-form-shell";
import { MultiDayConflictDialog } from "@/components/shared/multi-day-conflict-dialog";
import { MultiDayModeToggle } from "@/components/shared/multi-day-mode-toggle";
import { MultiDayPeriodPicker } from "@/components/shared/multi-day-period-picker";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import {
  DIALOG_SCROLL,
  FORM_INPUT_NUM_ICON,
  FORM_INPUT_PRICE,
  FORM_INPUT_TEXT,
  FORM_LINE_CARD,
  FORM_LINE_GRID_2,
  FORM_LINE_ROW_END,
} from "@/components/shared/form-dialog-styles";
import { StockPreviewPanel } from "@/components/shared/stock-preview-panel";
import { Button } from "@/components/ui/button";
import { DialogScrollRegion } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import { useDateRange } from "@/contexts/date-range-context";
import {
  useFarmConfig,
  useSalesStore,
  useTransfersStore,
} from "@/contexts/farm-store";
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
    oeufsCasses: SHOW_VENTE_CASSES
      ? traysToEggs(state.cassesAlveoles, cap)
      : 0,
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
  const [multiBlocks, setMultiBlocks] = React.useState<SalesMultiDayBlock[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [conflictDays, setConflictDays] = React.useState<string[]>([]);
  const pendingMultiRef = React.useRef<SalesMultiDayBlock[]>([]);
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
    const blocks = days.map((d) => emptySalesMultiBlock(d, defaultPrix));
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
    setMultiBlocks(blocks);
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
        multiBlocks: blocks,
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
        multiBlocks,
      }),
    [
      isEditMode,
      editDraft,
      draft,
      multiMode,
      periodFrom,
      periodTo,
      multiBlocks,
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
    const cassesEggs = SHOW_VENTE_CASSES
      ? traysToEggs(editDraft.cassesAlveoles, cap)
      : 0;
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
            blocks: multiBlocks,
          })
        : null,
    [multiMode, isEditMode, multiBlocks, salesState.ventes, getAllTransfers, cap]
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
    setMultiBlocks((prev) =>
      syncLinesWithPeriod(prev, multiDayISOs, (jourISO) =>
        emptySalesMultiBlock(jourISO, defaultPrix)
      )
    );
  }, [multiMode, multiDayISOs, defaultPrix]);

  const filledMultiBlocks = React.useMemo(
    () => multiBlocks.filter(isSalesBlockFilled),
    [multiBlocks]
  );

  const canSubmitMulti =
    multiDayISOs.length > 0 &&
    filledMultiBlocks.length > 0 &&
    !(multiPreview?.stockNegatif ?? false);

  const blockToStorageDrafts = React.useCallback(
    (block: SalesMultiDayBlock) =>
      saleDayUiToStorageDrafts(
        {
          jourISO: startOfDay(new Date(block.jourISO)).toISOString(),
          lignes: block.lignes.filter((l) => l.alveoles > 0),
          oeufsCasses: SHOW_VENTE_CASSES
            ? traysToEggs(block.cassesAlveoles, cap)
            : 0,
        },
        cap
      ),
    [cap]
  );

  const persistMultiBlocks = React.useCallback(
    (blocks: SalesMultiDayBlock[], resolution: MultiDayConflictResolution | null) => {
      clearError();
      runSubmit(() => {
        for (const block of blocks) {
          const existing = getActiveVentesForDay(salesState.ventes, block.jourISO);
          const drafts = blockToStorageDrafts(block);
          if (drafts.length === 0) continue;
          if (existing.length > 0) {
            if (resolution === "ignore") continue;
            for (const sale of existing) {
              cancelSale(sale.id);
            }
          }
          addSalesDay(drafts);
        }
      });
    },
    [addSalesDay, blockToStorageDrafts, cancelSale, clearError, runSubmit, salesState.ventes]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (multiMode && !isEditMode) {
      if (!canSubmitMulti) return;
      const conflicts = filledMultiBlocks
        .filter((block) => getActiveVentesForDay(salesState.ventes, block.jourISO).length > 0)
        .map((block) => block.jourISO);
      if (conflicts.length > 0) {
        pendingMultiRef.current = filledMultiBlocks;
        setConflictDays(conflicts);
        setConflictOpen(true);
        return;
      }
      persistMultiBlocks(filledMultiBlocks, null);
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
          cassesVente: SHOW_VENTE_CASSES
            ? traysToEggs(editDraft.cassesAlveoles, cap)
            : 0,
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

  const previewPanel =
    multiMode && !isEditMode && multiPreview ? (
      <StockPreviewPanel
        stockDisponible={multiPreview.stockDisponibleAlv}
        stockApres={multiPreview.stockApresAlv}
        montant={multiPreview.montantTotal}
        stockNegatif={multiPreview.stockNegatif}
        deltaAlv={multiPreview.deltaAlv}
        caLabel={multiPreview.caLabel}
        stockDebutLabel={multiPreview.stockDebutLabel}
        stockFinLabel={multiPreview.stockFinLabel}
      />
    ) : isEditMode && editValidation ? (
      <StockPreviewPanel
        stockDisponible={eggsToTrays(editValidation.stockDisponible, cap)}
        stockApres={eggsToTrays(Math.max(0, editValidation.stockApres), cap)}
        montant={editValidation.montantTotal}
        stockNegatif={editValidation.stockApres < 0}
      />
    ) : !isEditMode && dayPreview ? (
      <StockPreviewPanel
        stockDisponible={dayPreview.stockDisponibleAlv}
        stockApres={dayPreview.stockApresAlv}
        montant={dayPreview.montantTotal}
        stockNegatif={dayPreview.stockNegatif}
        deltaAlv={dayPreview.deltaAlv}
        caLabel={dayPreview.caLabel}
      />
    ) : null;

  const modeToggle = !isEditMode ? (
    <MultiDayModeToggle multiMode={multiMode} onToggle={() => setMultiMode((m) => !m)} />
  ) : null;

  return (
    <>
      <DialogFormShell
        open={open}
        onOpenChange={unsaved.dialogProps.onOpenChange}
        title={isEditMode ? "Modifier la vente" : "Ventes du jour"}
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
                  <SalesMultiDayForm
                    blocks={multiBlocks}
                    ventes={salesState.ventes}
                    defaultPrix={defaultPrix}
                    onChange={setMultiBlocks}
                  />
                </DialogScrollRegion>
              </>
            ) : (
              <>
                <DialogDateRow toggle={modeToggle}>
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
                </DialogDateRow>
                <DialogScrollRegion className={DIALOG_SCROLL}>
                  <div className="space-y-2">
                    <DialogDayLinesToolbar
                      label={isEditMode ? "Ligne de vente" : "Lignes de vente"}
                      onAdd={isEditMode ? undefined : addLine}
                    />
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
                      <>
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
                            errors={touched ? dayErrors.lignes?.[index] : undefined}
                            onDelete={() => removeLine(index)}
                            deleteDisabled={draft.lignes.length <= 1}
                          />
                        ))}
                        {touched && dayErrors.form ? (
                          <p className="text-[11px] text-danger">{dayErrors.form}</p>
                        ) : null}
                      </>
                    )}
                  </div>
                </DialogScrollRegion>
              </>
            )}
            <StoreErrorBanner error={salesState.errors} />
          </>
        }
        preview={previewPanel}
        footer={
          <>
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
          </>
        }
      />

      <MultiDayConflictDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        conflictDays={conflictDays}
        onResolve={(resolution) => {
          const blocks =
            pendingMultiRef.current.length > 0
              ? pendingMultiRef.current
              : filledMultiBlocks;
          pendingMultiRef.current = [];
          persistMultiBlocks(blocks, resolution);
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
      multiBlocks: SalesMultiDayBlock[];
    };

function salesFormComparable(input: {
  isEditMode: boolean;
  editDraft: SaleEditFormState;
  dayDraft: SaleDayFormState;
  multiMode: boolean;
  periodFrom: string;
  periodTo: string;
  multiBlocks: SalesMultiDayBlock[];
}): SalesFormComparable {
  if (input.isEditMode) {
    return { mode: "edit", editDraft: input.editDraft };
  }
  if (input.multiMode) {
    return {
      mode: "multi",
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      multiBlocks: input.multiBlocks,
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
    <div className={FORM_LINE_CARD}>
      <div className={FORM_LINE_GRID_2}>
        <FormField
          label="Qté vendues"
          htmlFor={`alv-${alveoles}-${prix}`}
          required
          error={errors?.alveoles}
          hint="alvéoles"
        >
          <div className="relative">
            <ShoppingBag className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
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
              className={FORM_INPUT_NUM_ICON}
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
            className={FORM_INPUT_PRICE}
          />
        </FormField>
      </div>

      <div className={FORM_LINE_ROW_END}>
        <FormField
          label="Client (optionnel)"
          htmlFor={`client-${alveoles}`}
          className="min-w-0 flex-1"
        >
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Optionnel"
              value={client}
              onChange={(e) => onClientChange(e.target.value)}
              className={`${FORM_INPUT_TEXT} pl-8`}
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
