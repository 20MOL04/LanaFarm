"use client";

import * as React from "react";

import { FormField } from "@/components/shared/form-field";
import { DateInput } from "@/components/shared/date-input";
import { formatRange, toIsoDate, type DateRange } from "@/lib/date-ranges";
import { clampMultiDayPeriod, enumerateDayISOs } from "@/lib/multi-day";

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
  const clamped = React.useMemo(
    () => clampMultiDayPeriod(fromIso, toIso, maxDateIso),
    [fromIso, toIso, maxDateIso]
  );

  React.useEffect(() => {
    if (clamped.fromIso !== fromIso) onFromChange(clamped.fromIso);
    if (clamped.toIso !== toIso) onToChange(clamped.toIso);
  }, [clamped.fromIso, clamped.toIso, fromIso, toIso, onFromChange, onToChange]);

  const dayCount = enumerateDayISOs(clamped.fromIso, clamped.toIso).length;
  const periodInvalid = dayCount === 0;

  const applyFrom = (iso: string) => {
    const next = clampMultiDayPeriod(iso, toIso, maxDateIso);
    onFromChange(next.fromIso);
    if (next.toIso !== toIso) onToChange(next.toIso);
  };

  const applyTo = (iso: string) => {
    const next = clampMultiDayPeriod(fromIso, iso, maxDateIso);
    onFromChange(next.fromIso);
    onToChange(next.toIso);
  };

  const globalEndIso = hintRange ? toIsoDate(hintRange.to) : null;
  const cappedByToday =
    globalEndIso != null &&
    globalEndIso > maxDateIso &&
    clamped.toIso === maxDateIso;

  return (
    <div className="min-w-0 space-y-2 rounded-card border border-border bg-card-muted/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Période
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Du" htmlFor="multi-from" required>
          <DateInput
            id="multi-from"
            value={clamped.fromIso}
            max={maxDateIso}
            onChange={(e) => applyFrom(e.target.value)}
          />
        </FormField>
        <FormField label="Au" htmlFor="multi-to" required>
          <DateInput
            id="multi-to"
            value={clamped.toIso}
            min={clamped.fromIso}
            onChange={(e) => applyTo(e.target.value)}
          />
        </FormField>
      </div>
      {periodInvalid ? (
        <p className="text-[11px] text-danger">Sélectionnez une période valide (max. 31 jours).</p>
      ) : (
        <p className="text-[11px] text-muted">
          {dayCount} jour{dayCount > 1 ? "s" : ""}
          {hintRange ? ` · Calendrier global : ${formatRange(hintRange)}` : null}
          {cappedByToday ? (
            <span className="mt-0.5 block text-[10px] leading-snug">
              Jusqu&apos;à aujourd&apos;hui uniquement — les jours futurs du calendrier global ne sont pas
              saisissables.
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}
