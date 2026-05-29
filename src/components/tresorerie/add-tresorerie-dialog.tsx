"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { Info, PiggyBank, Trash2 } from "lucide-react";

import {
  isTresorerieBlockFilled,
  TresorerieMultiDayForm,
  type TresorerieMultiDayBlock,
} from "@/components/tresorerie/tresorerie-multi-day-form";
import { ComboboxMethode } from "@/components/shared/combobox-methode";
import { DateInput } from "@/components/shared/date-input";
import { DialogDateRow } from "@/components/shared/dialog-date-row";
import { DialogDayLinesToolbar } from "@/components/shared/dialog-day-lines-toolbar";
import { DialogFormShell } from "@/components/shared/dialog-form-shell";
import { MultiDayConflictDialog } from "@/components/shared/multi-day-conflict-dialog";
import { MultiDayModeToggle } from "@/components/shared/multi-day-mode-toggle";
import { MultiDayPeriodPicker } from "@/components/shared/multi-day-period-picker";
import { FormField } from "@/components/shared/form-field";
import {
  DIALOG_SCROLL,
  FORM_INPUT_MONTANT,
  FORM_INPUT_NOTES,
  FORM_LINE_CARD,
  FORM_LINE_GRID_2,
  FORM_LINE_GRID_3,
} from "@/components/shared/form-dialog-styles";
import { PreviewCell, PreviewGrid, PreviewPanelShell } from "@/components/shared/preview-panel";
import { StoreErrorBanner } from "@/components/shared/store-error-banner";
import { Button } from "@/components/ui/button";
import { DialogScrollRegion } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useExpensesStore,
  useFarmConfig,
  useSalesStore,
  useTresorerieStore,
} from "@/contexts/farm-store";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import { useDateRange } from "@/contexts/date-range-context";
import { kpiCA, kpiDepenses, kpiResteAVerser } from "@/lib/kpi-sources";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import {
  clampMultiDayPeriod,
  enumerateDayISOs,
  getActiveTresorerieForDay,
  hasActiveTresorerieForDay,
  syncLinesWithPeriod,
  type MultiDayConflictResolution,
} from "@/lib/multi-day";
import { type TresorerieDraft, type TresorerieFormErrors } from "@/lib/tresorerie-calc";
import { cn } from "@/lib/utils";
import type { FarmConfig, Tresorerie } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Tresorerie | null;
};

type TresorerieLineUi = {
  methode: string;
  montantRecu: number;
};

type TresorerieDayFormState = {
  jourISO: string;
  lignes: TresorerieLineUi[];
};

type LineFormErrors = {
  methode?: string;
  montantRecu?: string;
};

type TresorerieDayFormErrors = {
  jourISO?: string;
  form?: string;
  lignes?: Partial<Record<number, LineFormErrors>>;
};

const todayIso = () => format(startOfDay(new Date()), "yyyy-MM-dd");

function isSameCalendarDay(a: string, b: string): boolean {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();
}

function emptyLine(): TresorerieLineUi {
  return { methode: "", montantRecu: 0 };
}

function emptyDayDraft(): TresorerieDayFormState {
  return { jourISO: todayIso(), lignes: [emptyLine()] };
}

function emptyTresorerieBlock(jourISO: string): TresorerieMultiDayBlock {
  return { jourISO, lignes: [emptyLine()] };
}

function draftFromTresorerie(entry: Tresorerie): TresorerieDraft {
  const d = new Date(entry.jourISO);
  const jourISO = Number.isNaN(d.getTime())
    ? todayIso()
    : format(startOfDay(d), "yyyy-MM-dd");
  const montant = entry.depose > 0 ? entry.depose : entry.montantRecu;
  return {
    jourISO,
    montantRecu: montant,
    depose: montant,
    methode: entry.methode,
    note: entry.note ?? "",
  };
}

function validateEditDraft(draft: TresorerieDraft): TresorerieFormErrors {
  const errors: TresorerieFormErrors = {};
  if (!draft.jourISO) errors.jourISO = "Date requise.";
  if (!draft.methode.trim()) errors.methode = "Méthode requise.";
  if (!Number.isFinite(draft.montantRecu) || draft.montantRecu <= 0) {
    errors.montantRecu = "Montant invalide.";
  }
  return errors;
}

function validateTresorerieDayDraft(draft: TresorerieDayFormState): TresorerieDayFormErrors {
  const errors: TresorerieDayFormErrors = {};
  const ligneErrors: NonNullable<TresorerieDayFormErrors["lignes"]> = {};

  if (!draft.jourISO) errors.jourISO = "Date requise.";

  const actives = draft.lignes
    .map((l, index) => ({ ...l, index }))
    .filter((l) => l.methode.trim().length > 0 || l.montantRecu > 0);

  if (actives.length === 0) {
    errors.form = "Ajoutez au moins une ligne avec méthode et montant.";
    return errors;
  }

  for (const ligne of actives) {
    const lineErr: LineFormErrors = {};
    if (!ligne.methode.trim()) lineErr.methode = "Méthode requise.";
    if (!Number.isFinite(ligne.montantRecu) || ligne.montantRecu <= 0) {
      lineErr.montantRecu = "Montant invalide.";
    }
    if (Object.keys(lineErr).length > 0) ligneErrors[ligne.index] = lineErr;
  }

  if (Object.keys(ligneErrors).length > 0) errors.lignes = ligneErrors;
  return errors;
}

/** Preview « Reste à verser » après saisie — distingue soldé, reste et dépassement. */
function resteApresPreview(resteApres: number): {
  value: string;
  tone?: "danger" | "success";
} {
  if (resteApres < 0) {
    return {
      value: `Dépassement : ${formatGNF(-resteApres)}`,
      tone: "danger",
    };
  }
  if (resteApres === 0) {
    return { value: "Tout versé", tone: "success" };
  }
  return { value: formatGNF(resteApres) };
}

export function AddTresorerieDialog({ open, onOpenChange, editEntry = null }: Props) {
  const { addTresorerieDay, updateTresorerie, cancelTresorerie, state, clearError } =
    useTresorerieStore();
  const { state: salesState } = useSalesStore();
  const { state: expensesState } = useExpensesStore();
  const { range } = useDateRange();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const isEditMode = !!editEntry;
  const [dayDraft, setDayDraft] = React.useState<TresorerieDayFormState>(emptyDayDraft);
  const [editDraft, setEditDraft] = React.useState<TresorerieDraft>(() => ({
    jourISO: todayIso(),
    montantRecu: 0,
    depose: 0,
    methode: "",
    note: "",
  }));
  const [touched, setTouched] = React.useState(false);
  const [multiMode, setMultiMode] = React.useState(false);
  const [periodFrom, setPeriodFrom] = React.useState(todayIso);
  const [periodTo, setPeriodTo] = React.useState(todayIso);
  const [multiBlocks, setMultiBlocks] = React.useState<TresorerieMultiDayBlock[]>([]);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [conflictDays, setConflictDays] = React.useState<string[]>([]);
  const pendingMultiRef = React.useRef<TresorerieMultiDayBlock[]>([]);
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
    const blocks = days.map(emptyTresorerieBlock);
    const edit = editEntry ? draftFromTresorerie(editEntry) : null;
    const day = emptyDayDraft();

    if (edit) {
      setEditDraft(edit);
    } else {
      setDayDraft(day);
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
      tresorerieFormComparable({
        isEditMode: !!edit,
        editDraft: edit ?? {
          jourISO: todayIso(),
          montantRecu: 0,
          depose: 0,
          methode: "",
          note: "",
        },
        dayDraft: day,
        multiMode: false,
        periodFrom: fromIso,
        periodTo: toIso,
        multiBlocks: blocks,
      })
    );
  }, [open, editEntry, clearError, range.from, range.to]);

  const formComparable = React.useMemo(
    () =>
      tresorerieFormComparable({
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
    () => (isEditMode ? {} : validateTresorerieDayDraft(dayDraft)),
    [isEditMode, dayDraft]
  );

  const editErrors: TresorerieFormErrors = React.useMemo(
    () => (isEditMode ? validateEditDraft(editDraft) : {}),
    [isEditMode, editDraft]
  );

  const editVersePending = React.useMemo(
    () => (isEditMode ? Math.max(0, editDraft.montantRecu) : 0),
    [isEditMode, editDraft.montantRecu]
  );

  const dayDate = React.useMemo(() => {
    if (!activeJourISO) return null;
    const d = new Date(activeJourISO);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [activeJourISO]);

  const draftVersePending = React.useMemo(
    () =>
      dayDraft.lignes.reduce((sum, l) => {
        if (l.methode.trim() && l.montantRecu > 0) return sum + l.montantRecu;
        return sum;
      }, 0),
    [dayDraft.lignes]
  );

  const resteGlobal = React.useMemo(
    () =>
      kpiResteAVerser(
        salesState.ventes,
        expensesState.depenses,
        state.tresorerie,
        cap,
        config
      ),
    [salesState.ventes, expensesState.depenses, state.tresorerie, cap, config]
  );

  const resteGlobalSansEntree = React.useMemo(() => {
    if (!editEntry) return resteGlobal;
    return kpiResteAVerser(
      salesState.ventes,
      expensesState.depenses,
      state.tresorerie.filter((t) => t.id !== editEntry.id),
      cap,
      config
    );
  }, [
    resteGlobal,
    editEntry,
    salesState.ventes,
    expensesState.depenses,
    state.tresorerie,
    cap,
    config,
  ]);

  const financeContext = React.useMemo(() => {
    if (!dayDate) return null;

    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const caPeriode = kpiCA(salesState.ventes, from, to, cap);
    const depensesPeriode = kpiDepenses(expensesState.depenses, from, to, config);
    const plafond = isEditMode ? resteGlobalSansEntree : resteGlobal;
    const verseSaisi = isEditMode ? editVersePending : draftVersePending;

    return {
      caPeriode,
      depensesPeriode,
      restePlafond: plafond,
      resteApres: plafond - verseSaisi,
      verseSaisi,
    };
  }, [
    dayDate,
    isEditMode,
    range.from,
    range.to,
    salesState.ventes,
    expensesState.depenses,
    config,
    cap,
    draftVersePending,
    editVersePending,
    resteGlobal,
    resteGlobalSansEntree,
  ]);

  const hasActiveLine = isEditMode
    ? editDraft.methode.trim().length > 0 && editDraft.montantRecu > 0
    : dayDraft.lignes.some((l) => l.methode.trim().length > 0 && l.montantRecu > 0);

  const editLineErrors: LineFormErrors | undefined = React.useMemo(() => {
    if (!isEditMode || !touched) return undefined;
    return {
      methode: editErrors.methode,
      montantRecu: editErrors.montantRecu,
    };
  }, [isEditMode, touched, editErrors]);

  const hasErrors = isEditMode
    ? Object.keys(editErrors).length > 0
    : Object.keys(dayErrors).length > 0;

  const versementPending = isEditMode ? editVersePending : draftVersePending;

  const plafondVersement = isEditMode ? resteGlobalSansEntree : resteGlobal;

  const rienAVerser = plafondVersement <= 0;
  const depasseReste =
    versementPending > 0 && versementPending > plafondVersement;

  const canSubmit =
    !!dayDate &&
    hasActiveLine &&
    !hasErrors &&
    !rienAVerser &&
    versementPending > 0 &&
    !depasseReste;

  const multiDayISOs = React.useMemo(
    () => enumerateDayISOs(periodFrom, periodTo),
    [periodFrom, periodTo]
  );

  React.useEffect(() => {
    if (!multiMode) return;
    setMultiBlocks((prev) =>
      syncLinesWithPeriod(prev, multiDayISOs, emptyTresorerieBlock)
    );
  }, [multiMode, multiDayISOs]);

  const filledMultiBlocks = React.useMemo(
    () => multiBlocks.filter(isTresorerieBlockFilled),
    [multiBlocks]
  );

  const multiDraftTotal = React.useMemo(
    () =>
      filledMultiBlocks.reduce(
        (sum, block) =>
          sum +
          block.lignes.reduce((s, l) => {
            if (l.methode.trim() && l.montantRecu > 0) return s + l.montantRecu;
            return s;
          }, 0),
        0
      ),
    [filledMultiBlocks]
  );

  const multiDepasseReste =
    multiDraftTotal > 0 && multiDraftTotal > resteGlobal;

  const canSubmitMulti =
    multiDayISOs.length > 0 &&
    filledMultiBlocks.length > 0 &&
    resteGlobal > 0 &&
    multiDraftTotal > 0 &&
    !multiDepasseReste;

  const persistMultiBlocks = React.useCallback(
    (blocks: TresorerieMultiDayBlock[], resolution: MultiDayConflictResolution | null) => {
      clearError();
      runSubmit(() => {
        for (const block of blocks) {
          const existing = getActiveTresorerieForDay(state.tresorerie, block.jourISO);
          if (existing.length > 0) {
            if (resolution === "ignore") continue;
            for (const entry of existing) {
              cancelTresorerie(entry.id);
            }
          }
          const lignes = block.lignes
            .filter((l) => l.methode.trim().length > 0 && l.montantRecu > 0)
            .map((l) => ({
              methode: l.methode.trim(),
              montantRecu: l.montantRecu,
            }));
          if (lignes.length === 0) continue;
          addTresorerieDay(startOfDay(new Date(block.jourISO)).toISOString(), lignes);
        }
      });
    },
    [addTresorerieDay, cancelTresorerie, clearError, runSubmit, state.tresorerie]
  );

  const updateLine = (index: number, patch: Partial<TresorerieLineUi>) => {
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
        .filter((block) => hasActiveTresorerieForDay(state.tresorerie, block.jourISO))
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
        const montant = editDraft.montantRecu;
        updateTresorerie(editEntry.id, {
          jourISO: dayDate.toISOString(),
          montantRecu: montant,
          depose: montant,
          methode: editDraft.methode.trim(),
          note: editDraft.note?.trim() ? editDraft.note.trim() : undefined,
        });
      } else {
        const lignes = dayDraft.lignes
          .filter((l) => l.methode.trim().length > 0 || l.montantRecu > 0)
          .map((l) => ({
            methode: l.methode.trim(),
            montantRecu: l.montantRecu,
          }));
        addTresorerieDay(dayDate.toISOString(), lignes);
      }
    });
  };

  const storeBatchError =
    state.errors?.code === "TRESORERIE_BATCH_INVALID" ||
    state.errors?.code === "VERSEMENT_DEPASSE_RESTE"
      ? state.errors.message
      : undefined;

  const modeToggle = !isEditMode ? (
    <MultiDayModeToggle multiMode={multiMode} onToggle={() => setMultiMode((m) => !m)} />
  ) : null;

  return (
    <>
      <DialogFormShell
        open={open}
        onOpenChange={unsaved.dialogProps.onOpenChange}
        title={isEditMode ? "Modifier la saisie" : "Versements du jour"}
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
                  <TresorerieMultiDayForm
                    blocks={multiBlocks}
                    tresorerie={state.tresorerie}
                    config={config}
                    onChange={setMultiBlocks}
                  />
                </DialogScrollRegion>
              </>
            ) : (
              <>
                <DialogDateRow toggle={modeToggle}>
                  <FormField
                    label="Jour"
                    htmlFor="treso-day"
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
                      id="treso-day"
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
                </DialogDateRow>

                <DialogScrollRegion className={DIALOG_SCROLL}>
              <div className="space-y-2">
                {financeContext ? (
                  <WeekContextPanel
                    caPeriode={financeContext.caPeriode}
                    depensesPeriode={financeContext.depensesPeriode}
                    resteGlobal={financeContext.restePlafond}
                  />
                ) : null}

                <DialogDayLinesToolbar
                  label={isEditMode ? "Versement" : "Versements"}
                  onAdd={isEditMode ? undefined : addLine}
                />

                {isEditMode ? (
                  <>
                    <TresorerieLineCard
                      methode={editDraft.methode}
                      montantRecu={editDraft.montantRecu}
                      methodes={config.listes.methodesPaiement}
                      onMethodeChange={(v) =>
                        setEditDraft((d) => ({ ...d, methode: v }))
                      }
                      onMontantRecuChange={(v) =>
                        setEditDraft((d) => ({
                          ...d,
                          montantRecu: v,
                          depose: v,
                        }))
                      }
                      errors={editLineErrors}
                      showDelete={false}
                    />
                    <FormField label="Notes (optionnel)" htmlFor="treso-edit-note">
                      <Textarea
                        id="treso-edit-note"
                        value={editDraft.note ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, note: e.target.value }))
                        }
                        placeholder="Optionnel"
                        rows={2}
                        maxLength={240}
                        className={FORM_INPUT_NOTES}
                      />
                    </FormField>
                    {touched && editErrors.jourISO ? (
                      <p className="text-[11px] text-danger">{editErrors.jourISO}</p>
                    ) : null}
                    {touched && storeBatchError ? (
                      <p className="text-[11px] text-danger">{storeBatchError}</p>
                    ) : null}
                    {rienAVerser ? (
                      <p className="text-[11px] text-muted">
                        Rien à verser pour le moment.
                      </p>
                    ) : null}
                    {depasseReste ? (
                      <p className="text-[11px] text-danger">
                        Le montant dépasse le reste à verser ({formatGNF(plafondVersement)}).
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    {dayDraft.lignes.map((ligne, index) => (
                      <TresorerieLineCard
                        key={index}
                        methode={ligne.methode}
                        montantRecu={ligne.montantRecu}
                        methodes={config.listes.methodesPaiement}
                        onMethodeChange={(v) => updateLine(index, { methode: v })}
                        onMontantRecuChange={(v) => updateLine(index, { montantRecu: v })}
                        errors={touched ? dayErrors.lignes?.[index] : undefined}
                        onDelete={() => removeLine(index)}
                        deleteDisabled={dayDraft.lignes.length <= 1}
                      />
                    ))}
                    {touched && dayErrors.form ? (
                      <p className="text-[11px] text-danger">{dayErrors.form}</p>
                    ) : null}
                    {touched && storeBatchError ? (
                      <p className="text-[11px] text-danger">{storeBatchError}</p>
                    ) : null}
                    {!isEditMode && rienAVerser ? (
                      <p className="text-[11px] text-muted">
                        Rien à verser pour le moment.
                      </p>
                    ) : null}
                    {!isEditMode && depasseReste ? (
                      <p className="text-[11px] text-danger">
                        Le montant dépasse le reste à verser ({formatGNF(plafondVersement)}).
                      </p>
                    ) : null}
                  </>
                )}
              </div>
                </DialogScrollRegion>
              </>
            )}

            {!isEditMode && multiMode && rienAVerser ? (
              <p className="text-[11px] text-muted">Rien à verser pour le moment.</p>
            ) : null}
            {!isEditMode && multiMode && multiDepasseReste ? (
              <p className="text-[11px] text-danger">
                Le total dépasse le reste à verser ({formatGNF(resteGlobal)}).
              </p>
            ) : null}

            <StoreErrorBanner error={state.errors} />
          </>
        }
        preview={
          multiMode && !isEditMode ? (
            <PreviewPanelShell variant={multiDepasseReste ? "danger" : "default"}>
              <PreviewGrid cols={2}>
                <PreviewCell
                  label="Jours saisis"
                  value={String(filledMultiBlocks.length)}
                />
                <PreviewCell label="Total saisi" value={formatGNF(multiDraftTotal)} />
                <PreviewCell
                  label="Reste à verser"
                  value={formatGNF(resteGlobal)}
                />
                <PreviewCell
                  label="Après saisie"
                  {...resteApresPreview(resteGlobal - multiDraftTotal)}
                />
              </PreviewGrid>
            </PreviewPanelShell>
          ) : financeContext ? (
            <PreviewPanelShell
              variant={financeContext.resteApres < 0 ? "danger" : "default"}
            >
              <PreviewGrid cols={2}>
                <PreviewCell
                  label={isEditMode ? "Montant saisi" : "Versé ce jour"}
                  value={formatGNF(financeContext.verseSaisi)}
                />
                <PreviewCell
                  label="Reste à verser"
                  {...resteApresPreview(financeContext.resteApres)}
                />
              </PreviewGrid>
            </PreviewPanelShell>
          ) : null
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

type TresorerieFormComparable =
  | { mode: "edit"; editDraft: TresorerieDraft }
  | { mode: "day"; dayDraft: TresorerieDayFormState }
  | {
      mode: "multi";
      periodFrom: string;
      periodTo: string;
      multiBlocks: TresorerieMultiDayBlock[];
    };

function tresorerieFormComparable(input: {
  isEditMode: boolean;
  editDraft: TresorerieDraft;
  dayDraft: TresorerieDayFormState;
  multiMode: boolean;
  periodFrom: string;
  periodTo: string;
  multiBlocks: TresorerieMultiDayBlock[];
}): TresorerieFormComparable {
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

function TresorerieLineCard({
  methode,
  montantRecu,
  methodes,
  onMethodeChange,
  onMontantRecuChange,
  errors,
  onDelete,
  deleteDisabled,
  showDelete = true,
}: {
  methode: string;
  montantRecu: number;
  methodes: FarmConfig["listes"]["methodesPaiement"];
  onMethodeChange: (v: string) => void;
  onMontantRecuChange: (v: number) => void;
  errors?: LineFormErrors;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  showDelete?: boolean;
}) {
  return (
    <div className={FORM_LINE_CARD}>
      <div className={showDelete ? FORM_LINE_GRID_3 : FORM_LINE_GRID_2}>
        <FormField
          label="Méthode"
          htmlFor={`treso-meth-${methode}-${montantRecu}`}
          required
          error={errors?.methode}
        >
          <ComboboxMethode
            value={methode}
            onChange={onMethodeChange}
            methodes={methodes}
            placeholder="Ex : Orange Money"
          />
        </FormField>
        <MoneyField
          id={`treso-mnt-${methode}-${montantRecu}`}
          label="Montant versé"
          value={montantRecu}
          onChange={onMontantRecuChange}
          error={errors?.montantRecu}
          required
        />
        {showDelete && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mb-0.5 shrink-0 self-end"
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

type MoneyFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  error?: string;
  required?: boolean;
};

function MoneyField({
  id,
  label,
  value,
  onChange,
  error,
  required,
}: MoneyFieldProps) {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error}>
      <div className="relative">
        <PiggyBank className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            onChange(Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)));
          }}
          onFocus={(e) => e.currentTarget.select()}
          className={FORM_INPUT_MONTANT}
          required={required}
        />
      </div>
    </FormField>
  );
}

/** Contexte période — replié par défaut pour garder la saisie compacte. */
function WeekContextPanel({
  caPeriode,
  depensesPeriode,
  resteGlobal,
}: {
  caPeriode: number;
  depensesPeriode: number;
  resteGlobal: number;
}) {
  const badge = resteApresPreview(resteGlobal);
  return (
    <details className="rounded-card border border-border bg-card-muted/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
          Contexte
        </span>
        <span
          className={cn(
            "shrink-0 tabular-nums",
            badge.tone === "danger" && "text-danger",
            badge.tone === "success" && "text-success",
            !badge.tone && "text-warning"
          )}
        >
          {badge.value}
        </span>
      </summary>
      <dl className="space-y-1 border-t border-border px-3 py-2 text-[11px]">
        <FinanceRow label="CA période (info)" value={formatGNF(caPeriode)} />
        <FinanceRow label="Dépenses période (info)" value={formatGNF(depensesPeriode)} />
        <FinanceRow label="Reste à verser (global)" value={formatGNF(resteGlobal)} />
      </dl>
    </details>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
