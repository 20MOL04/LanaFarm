"use client";

import { FormField } from "@/components/shared/form-field";
import { DateInput } from "@/components/shared/date-input";
import { formatRange, type DateRange } from "@/lib/date-ranges";
import { enumerateDayISOs } from "@/lib/multi-day";

type Props = {
  fromIso: string;
  toIso: string;
  onFromChange: (iso: string) => void;
  onToChange: (iso: string) => void;
  maxDateIso: string;
  hintRange?: DateRange;
};

export function MultiDayPeriodPicker({
  fromIso,
  toIso,
  onFromChange,
  onToChange,
  maxDateIso,
  hintRange,
}: Props) {
  const dayCount = enumerateDayISOs(fromIso, toIso).length;
  const periodInvalid = dayCount === 0;

  return (
    <div className="min-w-0 space-y-2 rounded-card border border-border bg-card-muted/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Période
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Du" htmlFor="multi-from" required>
          <DateInput
            id="multi-from"
            value={fromIso}
            max={maxDateIso}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </FormField>
        <FormField label="Au" htmlFor="multi-to" required>
          <DateInput
            id="multi-to"
            value={toIso}
            min={fromIso}
            max={maxDateIso}
            onChange={(e) => onToChange(e.target.value)}
          />
        </FormField>
      </div>
      {periodInvalid ? (
        <p className="text-[11px] text-danger">Sélectionnez une période valide (max. 31 jours).</p>
      ) : (
        <p className="text-[11px] text-muted">
          {dayCount} jour{dayCount > 1 ? "s" : ""}
          {hintRange ? ` · Calendrier global : ${formatRange(hintRange)}` : null}
        </p>
      )}
    </div>
  );
}
