"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarDays, Info, PiggyBank, Plus, Trash2 } from "lucide-react";

import { ComboboxMethode } from "@/components/shared/combobox-methode";
import { FormField } from "@/components/shared/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import { useTresorerieStore, useFarmConfig, useSalesStore } from "@/contexts/farm-store";
import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";
import { useStoreSubmitGuard } from "@/hooks/use-store-submit-guard";
import { useUnsavedDialogClose } from "@/hooks/use-unsaved-dialog-close";
import { isDirtyComparedToSnapshot, stableStringify } from "@/lib/form-dirty";
import { useDateRange } from "@/contexts/date-range-context";
import { kpiCA, kpiDepenses } from "@/lib/kpi-sources";
import { formatDay } from "@/lib/date-ranges";
import { formatGNF } from "@/lib/format";
import {
  type TresorerieDraft,
  type TresorerieFormErrors,
  validateTresorerieDraft,
} from "@/lib/tresorerie-calc";
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

function draftFromTresorerie(entry: Tresorerie): TresorerieDraft {
  const d = new Date(entry.jourISO);
  const jourISO = Number.isNaN(d.getTime())
    ? todayIso()
    : format(startOfDay(d), "yyyy-MM-dd");
  return {
    jourISO,
    montantRecu: entry.montantRecu,
    depose: entry.depose,
    methode: entry.methode,
    note: entry.note ?? "",
  };
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

export function AddTresorerieDialog({ open, onOpenChange, editEntry = null }: Props) {
  const { addTresorerieDay, updateTresorerie, state, clearError } =
    useTresorerieStore();
  const { state: salesState } = useSalesStore();
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
  const openSnapshotRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      openSnapshotRef.current = null;
      return;
    }
    const edit = editEntry ? draftFromTresorerie(editEntry) : null;
    const day = emptyDayDraft();

    if (edit) {
      setEditDraft(edit);
    } else {
      setDayDraft(day);
    }
    setTouched(false);
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
      })
    );
  }, [open, editEntry, clearError]);

  const formComparable = React.useMemo(
    () =>
      tresorerieFormComparable({
        isEditMode,
        editDraft,
        dayDraft,
      }),
    [isEditMode, editDraft, dayDraft]
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
    () => (isEditMode ? validateTresorerieDraft(editDraft) : {}),
    [isEditMode, editDraft]
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

  const weekFinance = React.useMemo(() => {
    if (!dayDate || isEditMode) return null;

    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    const caPeriode = kpiCA(salesState.ventes, from, to, cap);
    const depensesPeriode = kpiDepenses(state.depenses, from, to, config);
    const netARemettre = caPeriode - depensesPeriode;

    const dejaVerse = state.tresorerie
      .filter((t) => t.statut === "actif")
      .filter((t) => {
        const tDate = new Date(t.jourISO);
        return tDate.getTime() >= from.getTime() && tDate.getTime() <= to.getTime();
      })
      .reduce((sum, t) => sum + t.depose, 0);

    const reste = netARemettre - dejaVerse;
    const resteApres = reste - draftVersePending;

    return {
      caPeriode,
      depensesPeriode,
      netARemettre,
      dejaVerse,
      reste,
      resteApres,
    };
  }, [
    dayDate,
    isEditMode,
    range.from,
    range.to,
    salesState.ventes,
    state.depenses,
    state.tresorerie,
    config,
    cap,
    draftVersePending,
  ]);

  const hasActiveLine = isEditMode
    ? editDraft.methode.trim().length > 0 && editDraft.montantRecu > 0
    : dayDraft.lignes.some((l) => l.methode.trim().length > 0 && l.montantRecu > 0);

  const hasErrors = isEditMode
    ? Object.keys(editErrors).length > 0
    : Object.keys(dayErrors).length > 0;

  const canSubmit = !!dayDate && hasActiveLine && !hasErrors;

  const editReste = editDraft.montantRecu - editDraft.depose;

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
    setTouched(true);
    if (!canSubmit || !dayDate) return;

    clearError();
    runSubmit(() => {
      if (isEditMode && editEntry) {
        updateTresorerie(editEntry.id, {
          jourISO: dayDate.toISOString(),
          montantRecu: editDraft.montantRecu,
          depose: editDraft.depose,
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
    state.errors?.code === "TRESORERIE_BATCH_INVALID"
      ? state.errors.message
      : undefined;

  return (
    <>
    <Dialog open={open} onOpenChange={unsaved.dialogProps.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la saisie" : "Versements du jour"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody className="space-y-3">
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
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="treso-day"
                  type="date"
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
                  className="pl-9"
                  required
                />
              </div>
            </FormField>

            {!isEditMode && weekFinance ? (
              <WeekContextPanel
                caPeriode={weekFinance.caPeriode}
                depensesPeriode={weekFinance.depensesPeriode}
                netARemettre={weekFinance.netARemettre}
                dejaVerse={weekFinance.dejaVerse}
                reste={weekFinance.reste}
              />
            ) : null}

            {isEditMode ? (
              <EditTresorerieForm
                draft={editDraft}
                setDraft={setEditDraft}
                errors={touched ? editErrors : undefined}
                methodes={config.listes.methodesPaiement}
                reste={editReste}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Versements
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>

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
              </div>
            )}

            {!isEditMode && weekFinance ? (
              <DayVerseSummaryPanel
                totalJour={draftVersePending}
                resteApres={weekFinance.resteApres}
              />
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={unsaved.requestClose}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
              {isEditMode ? "Enregistrer les modifications" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesConfirm {...unsaved.confirmDialogProps} />
    </>
  );
}

type TresorerieFormComparable =
  | { mode: "edit"; editDraft: TresorerieDraft }
  | { mode: "day"; dayDraft: TresorerieDayFormState };

function tresorerieFormComparable(input: {
  isEditMode: boolean;
  editDraft: TresorerieDraft;
  dayDraft: TresorerieDayFormState;
}): TresorerieFormComparable {
  if (input.isEditMode) {
    return { mode: "edit", editDraft: input.editDraft };
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
}: {
  methode: string;
  montantRecu: number;
  methodes: FarmConfig["listes"]["methodesPaiement"];
  onMethodeChange: (v: string) => void;
  onMontantRecuChange: (v: number) => void;
  errors?: LineFormErrors;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-card-muted/30 p-2.5">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
          label="Montant reçu"
          value={montantRecu}
          onChange={onMontantRecuChange}
          error={errors?.montantRecu}
          required
        />
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
      </div>
    </div>
  );
}

/** Formulaire édition — inchangé (reçu + versé + notes). */
function EditTresorerieForm({
  draft,
  setDraft,
  errors,
  methodes,
  reste,
}: {
  draft: TresorerieDraft;
  setDraft: React.Dispatch<React.SetStateAction<TresorerieDraft>>;
  errors?: TresorerieFormErrors;
  methodes: FarmConfig["listes"]["methodesPaiement"];
  reste: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Méthode"
          htmlFor="treso-edit-methode"
          required
          error={errors?.methode}
        >
          <ComboboxMethode
            id="treso-edit-methode"
            value={draft.methode}
            onChange={(v) => setDraft((d) => ({ ...d, methode: v }))}
            methodes={methodes}
            placeholder="Ex : Orange Money"
          />
        </FormField>
        <MoneyField
          id="treso-edit-recu"
          label="Montant reçu"
          value={draft.montantRecu}
          onChange={(v) => setDraft((d) => ({ ...d, montantRecu: v }))}
          error={errors?.montantRecu}
          required
        />
        <MoneyField
          id="treso-edit-depose"
          label="Montant versé"
          value={draft.depose}
          onChange={(v) => setDraft((d) => ({ ...d, depose: v }))}
          error={errors?.depose}
          required
        />
      </div>

      <FormField label="Notes (optionnel)" htmlFor="treso-edit-note">
        <Textarea
          id="treso-edit-note"
          value={draft.note ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder="Ex : Reste à remettre la semaine prochaine."
          rows={2}
          maxLength={240}
        />
      </FormField>

      <EditRestePanel
        recu={draft.montantRecu}
        depose={draft.depose}
        reste={reste}
      />
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
        <PiggyBank className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-blue" />
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
          className="pl-9 tabular-nums"
          required={required}
        />
      </div>
    </FormField>
  );
}

/** Contexte période — lecture seule (hors saisie du jour). */
function WeekContextPanel({
  caPeriode,
  depensesPeriode,
  netARemettre,
  dejaVerse,
  reste,
}: {
  caPeriode: number;
  depensesPeriode: number;
  netARemettre: number;
  dejaVerse: number;
  reste: number;
}) {
  const soldeOk = reste <= 0;
  return (
    <div className="rounded-card border border-border bg-card-muted/50 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
          Cette semaine
        </p>
      </div>
      <dl className="space-y-1 text-[12px]">
        <FinanceRow label="CA période" value={formatGNF(caPeriode)} />
        <FinanceRow label="Dépenses" value={formatGNF(depensesPeriode)} />
        <div className="border-t border-border pt-1">
          <FinanceRow label="Net à remettre" value={formatGNF(netARemettre)} />
        </div>
        <FinanceRow label="Déjà remis" value={formatGNF(dejaVerse)} />
        <div className="flex justify-between gap-3 border-t border-border pt-1">
          <dt className="font-medium text-foreground">Reste</dt>
          <dd
            className={cn(
              "font-semibold tabular-nums",
              soldeOk ? "text-success" : "text-danger"
            )}
          >
            {soldeOk ? "Tout versé ✅" : formatGNF(reste)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Synthèse du jour — mise à jour live avec les lignes saisies. */
function DayVerseSummaryPanel({
  totalJour,
  resteApres,
}: {
  totalJour: number;
  resteApres: number;
}) {
  const depasse = resteApres < 0;
  const soldeOk = resteApres <= 0 && !depasse;
  return (
    <div className="space-y-1 rounded-card border border-border bg-card-muted px-3 py-2.5">
      <FinanceRow label="Total ce jour" value={formatGNF(totalJour)} />
      <div className="flex justify-between gap-3 border-t border-border pt-1">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Reste après
        </dt>
        <dd
          className={cn(
            "text-sm font-semibold tabular-nums",
            depasse && "text-danger",
            soldeOk && "text-success",
            !depasse && !soldeOk && "text-foreground"
          )}
        >
          {soldeOk ? "Tout versé ✅" : formatGNF(resteApres)}
        </dd>
      </div>
    </div>
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

function EditRestePanel({
  recu,
  depose,
  reste,
}: {
  recu: number;
  depose: number;
  reste: number;
}) {
  const negative = reste < 0;
  const zero = reste === 0;
  return (
    <div
      className={cn(
        "rounded-card border px-3 py-2.5",
        negative && "bg-danger-soft border-danger/30",
        !negative && zero && "bg-success-soft/60 border-success/20",
        !negative && !zero && "bg-warning-soft/60 border-warning/20"
      )}
    >
      <div className="grid grid-cols-3 gap-2">
        <SummaryCell label="Reçu" value={formatGNF(recu)} />
        <SummaryCell label="Versé" value={formatGNF(depose)} />
        <SummaryCell
          label="Reste"
          value={formatGNF(reste)}
          tone={negative ? "danger" : zero ? "success" : "warning"}
        />
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "success" | "warning";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[9.5px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-[13px] font-semibold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
