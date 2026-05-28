"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CircleDollarSign, Plus, Receipt, Trash2 } from "lucide-react";

import { ComboboxCategorie } from "@/components/shared/combobox-categorie";
import {
  ExpensesMultiDayForm,
  isExpenseBlockFilled,
  type ExpenseMultiDayBlock,
} from "@/components/expenses/expenses-multi-day-form";
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
import { useExpensesStore, useFarmConfig } from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import {
  type ExpenseDraft,
  type ExpenseFormErrors,
  validateExpenseDraft,
} from "@/lib/expenses-calc";
import { cn } from "@/lib/utils";
import {
  clampMultiDayPeriod,
  enumerateDayISOs,
  getActiveDepensesForDay,
  hasActiveDepensesForDay,
  syncLinesWithPeriod,
  type MultiDayConflictResolution,
} from "@/lib/multi-day";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import type { Depense, FarmConfig } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Depense | null;
};

type ExpenseLineUi = {
  categorie: string;
  montant: number;
  description: string;
};

type ExpenseDayFormState = {
  jourISO: string;
  lignes: ExpenseLineUi[];
};

type LineFormErrors = {
  categorie?: string;
  montant?: string;
  description?: string;
};

type ExpenseDayFormErrors = {
  jourISO?: string;
  form?: string;
  lignes?: Partial<Record<number, LineFormErrors>>;
};

const todayIso = () => format(startOfDay(new Date()), "yyyy-MM-dd");

function emptyLine(): ExpenseLineUi {
  return { categorie: "", montant: 0, description: "" };
}

function emptyDayDraft(): ExpenseDayFormState {
  return { jourISO: todayIso(), lignes: [emptyLine()] };
}

function draftFromDepense(entry: Depense): ExpenseDraft {
  const d = new Date(entry.jourISO);
  const jourISO = Number.isNaN(d.getTime())
    ? todayIso()
    : format(startOfDay(d), "yyyy-MM-dd");
  return {
    jourISO,
    categorie: entry.categorie,
    montant: entry.montant,
    description: entry.description ?? "",
  };
}

function validateExpenseDayDraft(draft: ExpenseDayFormState): ExpenseDayFormErrors {
  const errors: ExpenseDayFormErrors = {};
  const ligneErrors: NonNullable<ExpenseDayFormErrors["lignes"]> = {};

  if (!draft.jourISO) errors.jourISO = "Date requise.";

  const actives = draft.lignes
    .map((l, index) => ({ ...l, index }))
    .filter((l) => l.categorie.trim().length > 0 || l.montant > 0);

  if (actives.length === 0) {
    errors.form = "Ajoutez au moins une ligne avec catégorie et montant.";
    return errors;
  }

  for (const ligne of actives) {
    const lineErr: LineFormErrors = {};
    if (!ligne.categorie.trim()) lineErr.categorie = "Catégorie requise.";
    if (!Number.isFinite(ligne.montant) || ligne.montant <= 0) {
      lineErr.montant = "Montant invalide.";
    }
    if (ligne.description.length > 240) {
      lineErr.description = "240 caractères maximum.";
    }
    if (Object.keys(lineErr).length > 0) ligneErrors[ligne.index] = lineErr;
  }

  if (Object.keys(ligneErrors).length > 0) errors.lignes = ligneErrors;
  return errors;
}

function emptyExpenseBlock(jourISO: string): ExpenseMultiDayBlock {
  return { jourISO, lignes: [emptyLine()] };
}

export function AddExpenseDialog({ open, onOpenChange, editEntry = null }: Props) {
  const { addExpensesDay, updateExpense, cancelExpense, state, clearError } =
    useExpensesStore();
  const { range } = useDateRange();
  const config = useFarmConfig();
  const isEditMode = !!editEntry;
  const [dayDraft, setDayDraft] = React.useState<ExpenseDayFormState>(emptyDayDraft);
  const [editDraft, setEditDraft] = React.useState<ExpenseDraft>(() => ({
    jourISO: todayIso(),
    categorie: "",
    montant: 0,
    description: "",
  }));
  const [touched, setTouched] = React.useState(false);
  const [multiMode, setMultiMode] = React.useState(false);
  const [periodFrom, setPeriodFrom] = React.useState(todayIso);
  const [periodTo, setPeriodTo] = React.useState(todayIso);
  const [multiBlocks, setMultiBlocks] = React.useState<ExpenseMultiDayBlock[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [conflictDays, setConflictDays] = React.useState<string[]>([]);
  const pendingMultiRef = React.useRef<ExpenseMultiDayBlock[]>([]);
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
    const blocks = days.map(emptyExpenseBlock);
    const edit = editEntry ? draftFromDepense(editEntry) : null;

    if (edit) {
      setEditDraft(edit);
    } else {
      setDayDraft(emptyDayDraft());
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
      expenseFormComparable({
        isEditMode: !!edit,
        editDraft: edit ?? {
          jourISO: todayIso(),
          categorie: "",
          montant: 0,
          description: "",
        },
        dayDraft: emptyDayDraft(),
        multiMode: false,
        periodFrom: fromIso,
        periodTo: toIso,
        multiBlocks: blocks,
      })
    );
  }, [open, editEntry, clearError, range.from, range.to]);

  const formComparable = React.useMemo(
    () =>
      expenseFormComparable({
        isEditMode,
        editDraft,
        dayDraft,
        multiMode,
        periodFrom,
        periodTo,
        multiBlocks,
      }),
    [
      isEditMode,
      editDraft,
      dayDraft,
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
  const runSubmit = useStoreSubmitGuard(state.errors, closeDialog);

  const activeJourISO = isEditMode ? editDraft.jourISO : dayDraft.jourISO;

  const dayErrors = React.useMemo(
    () => (isEditMode ? {} : validateExpenseDayDraft(dayDraft)),
    [isEditMode, dayDraft]
  );

  const editErrors: ExpenseFormErrors = React.useMemo(
    () => (isEditMode ? validateExpenseDraft(editDraft) : {}),
    [isEditMode, editDraft]
  );

  const dayDate = React.useMemo(() => {
    if (!activeJourISO) return null;
    const d = new Date(activeJourISO);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [activeJourISO]);

  const totalMontant = React.useMemo(() => {
    if (isEditMode) return editDraft.montant;
    return dayDraft.lignes.reduce((sum, l) => {
      if (l.categorie.trim() && l.montant > 0) return sum + l.montant;
      return sum;
    }, 0);
  }, [isEditMode, editDraft.montant, dayDraft.lignes]);

  const hasActiveLine = isEditMode
    ? editDraft.categorie.trim().length > 0 && editDraft.montant > 0
    : dayDraft.lignes.some((l) => l.categorie.trim().length > 0 && l.montant > 0);

  const hasErrors = isEditMode
    ? Object.keys(editErrors).length > 0
    : Object.keys(dayErrors).length > 0;

  const canSubmit = !!dayDate && hasActiveLine && !hasErrors;

  const multiDayISOs = React.useMemo(
    () => enumerateDayISOs(periodFrom, periodTo),
    [periodFrom, periodTo]
  );

  React.useEffect(() => {
    if (!multiMode) return;
    setMultiBlocks((prev) =>
      syncLinesWithPeriod(prev, multiDayISOs, emptyExpenseBlock)
    );
  }, [multiMode, multiDayISOs]);

  const filledMultiBlocks = React.useMemo(
    () => multiBlocks.filter(isExpenseBlockFilled),
    [multiBlocks]
  );

  const canSubmitMulti = multiDayISOs.length > 0 && filledMultiBlocks.length > 0;

  const persistMultiBlocks = React.useCallback(
    (blocks: ExpenseMultiDayBlock[], resolution: MultiDayConflictResolution | null) => {
      clearError();
      runSubmit(() => {
        for (const block of blocks) {
          const existing = getActiveDepensesForDay(state.depenses, block.jourISO);
          if (existing.length > 0) {
            if (resolution === "ignore") continue;
            for (const dep of existing) {
              cancelExpense(dep.id);
            }
          }
          const lignes = block.lignes
            .filter((l) => l.categorie.trim().length > 0 && l.montant > 0)
            .map((l) => ({
              categorie: l.categorie.trim(),
              montant: l.montant,
              description: l.description.trim() || undefined,
            }));
          if (lignes.length === 0) continue;
          addExpensesDay(startOfDay(new Date(block.jourISO)).toISOString(), lignes);
        }
      });
    },
    [addExpensesDay, cancelExpense, clearError, runSubmit, state.depenses]
  );

  const updateLine = (index: number, patch: Partial<ExpenseLineUi>) => {
    setDayDraft((d) => ({
      ...d,
      lignes: d.lignes.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  };

  const addLine = () => {
    setDayDraft((d) => ({ ...d, lignes: [...d.lignes, emptyLine()] }));
  };

  const removeLine = (index: number) => {
    setDayDraft((d) => ({
      ...d,
      lignes: d.lignes.length <= 1 ? d.lignes : d.lignes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (multiMode && !isEditMode) {
      if (!canSubmitMulti) return;
      const conflicts = filledMultiBlocks
        .filter((block) => hasActiveDepensesForDay(state.depenses, block.jourISO))
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
        updateExpense(editEntry.id, {
          jourISO: dayDate.toISOString(),
          categorie: editDraft.categorie.trim(),
          montant: editDraft.montant,
          description: editDraft.description?.trim()
            ? editDraft.description.trim()
            : undefined,
        });
      } else {
        const lignes = dayDraft.lignes
          .filter((l) => l.categorie.trim().length > 0 || l.montant > 0)
          .map((l) => ({
            categorie: l.categorie.trim(),
            montant: l.montant,
            description: l.description.trim() || undefined,
          }));
        addExpensesDay(dayDate.toISOString(), lignes);
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
                {isEditMode ? "Modifier la dépense" : "Dépenses du jour"}
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
                  <ExpensesMultiDayForm
                    blocks={multiBlocks}
                    depenses={state.depenses}
                    config={config}
                    onChange={setMultiBlocks}
                  />
                </>
              ) : (
                <>
            <FormField
              label="Jour"
              htmlFor="dep-day"
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
                id="dep-day"
                value={isEditMode ? editDraft.jourISO : dayDraft.jourISO}
                max={todayIso()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isEditMode) {
                    setEditDraft((d) => ({ ...d, jourISO: v }));
                  } else {
                    setDayDraft((d) => ({ ...d, jourISO: v }));
                  }
                }}
                required
              />
            </FormField>

            {isEditMode ? (
              <ExpenseLineCard
                categorie={editDraft.categorie}
                montant={editDraft.montant}
                description={editDraft.description ?? ""}
                categories={config.listes.categoriesDepense}
                onCategorieChange={(v) => setEditDraft((d) => ({ ...d, categorie: v }))}
                onMontantChange={(v) => setEditDraft((d) => ({ ...d, montant: v }))}
                onDescriptionChange={(v) =>
                  setEditDraft((d) => ({ ...d, description: v }))
                }
                errors={
                  touched
                    ? {
                        categorie: editErrors.categorie,
                        montant: editErrors.montant,
                        description: editErrors.description,
                      }
                    : undefined
                }
                showDelete={false}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Lignes de dépense
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>

                {dayDraft.lignes.map((ligne, index) => (
                  <ExpenseLineCard
                    key={index}
                    categorie={ligne.categorie}
                    montant={ligne.montant}
                    description={ligne.description}
                    categories={config.listes.categoriesDepense}
                    onCategorieChange={(v) => updateLine(index, { categorie: v })}
                    onMontantChange={(v) => updateLine(index, { montant: v })}
                    onDescriptionChange={(v) => updateLine(index, { description: v })}
                    errors={touched ? dayErrors.lignes?.[index] : undefined}
                    onDelete={() => removeLine(index)}
                    deleteDisabled={dayDraft.lignes.length <= 1}
                  />
                ))}

                {touched && dayErrors.form ? (
                  <p className="text-[11px] text-danger">{dayErrors.form}</p>
                ) : null}
              </div>
            )}

            <TotalPanel montant={totalMontant} />
                </>
              )}

            <StoreErrorBanner error={state.errors} />
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

type ExpenseFormComparable =
  | { mode: "edit"; editDraft: ExpenseDraft }
  | { mode: "day"; dayDraft: ExpenseDayFormState }
  | {
      mode: "multi";
      periodFrom: string;
      periodTo: string;
      multiBlocks: ExpenseMultiDayBlock[];
    };

function expenseFormComparable(input: {
  isEditMode: boolean;
  editDraft: ExpenseDraft;
  dayDraft: ExpenseDayFormState;
  multiMode: boolean;
  periodFrom: string;
  periodTo: string;
  multiBlocks: ExpenseMultiDayBlock[];
}): ExpenseFormComparable {
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

function ExpenseLineCard({
  categorie,
  montant,
  description,
  categories,
  onCategorieChange,
  onMontantChange,
  onDescriptionChange,
  errors,
  onDelete,
  deleteDisabled,
  showDelete = true,
}: {
  categorie: string;
  montant: number;
  description: string;
  categories: FarmConfig["listes"]["categoriesDepense"];
  onCategorieChange: (v: string) => void;
  onMontantChange: (v: number) => void;
  onDescriptionChange: (v: string) => void;
  errors?: LineFormErrors;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  showDelete?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-card border border-border bg-card-muted p-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField
          label="Catégorie"
          htmlFor={`dep-cat-${categorie}-${montant}`}
          required
          error={errors?.categorie}
        >
          <ComboboxCategorie
            value={categorie}
            onChange={onCategorieChange}
            categories={categories}
            placeholder="Choisir ou saisir…"
          />
        </FormField>

        <FormField
          label="Montant"
          htmlFor={`dep-mnt-${categorie}-${montant}`}
          required
          error={errors?.montant}
        >
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={Number.isFinite(montant) ? montant : 0}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                onMontantChange(Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)));
              }}
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 pl-9 tabular-nums"
            />
          </div>
        </FormField>
      </div>

      <div className="flex items-end gap-2">
        <FormField
          label="Description (optionnel)"
          htmlFor={`dep-desc-${categorie}`}
          error={errors?.description}
          className="min-w-0 flex-1"
        >
          <Input
            id={`dep-desc-${categorie}`}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ex : Livraison marché Madina"
            maxLength={240}
            className="h-9"
          />
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

function TotalPanel({ montant }: { montant: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-card border border-border bg-card-muted px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Receipt className="h-3.5 w-3.5 text-muted" />
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Total du jour
        </p>
      </div>
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {formatGNF(montant)}
      </p>
    </div>
  );
}
