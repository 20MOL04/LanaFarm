"use client";

import * as React from "react";

import { FormField } from "@/components/shared/form-field";
import { DateInput } from "@/components/shared/date-input";
import { clampMultiDayPeriod, enumerateDayISOs } from "@/lib/multi-day";

type Props = {
  fromIso: string;
  toIso: string;
  onFromChange: (iso: string) => void;
  onToChange: (iso: string) => void;
  maxDateIso: string;
};

export function MultiDayPeriodPicker({
  fromIso,
  toIso,
  onFromChange,
  onToChange,
  maxDateIso,
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

  return (
    <div className="shrink-0 space-y-1.5">
      <p className="text-[11px] font-medium text-muted">Période</p>
      <div className="flex flex-wrap items-end gap-2">
        <FormField label="Du" htmlFor="multi-from" required className="mb-0">
          <DateInput
            id="multi-from"
            value={clamped.fromIso}
            max={maxDateIso}
            onChange={(e) => applyFrom(e.target.value)}
          />
        </FormField>
        <FormField label="Au" htmlFor="multi-to" required className="mb-0">
          <DateInput
            id="multi-to"
            value={clamped.toIso}
            min={clamped.fromIso}
            onChange={(e) => applyTo(e.target.value)}
          />
        </FormField>
      </div>
      {periodInvalid ? (
        <p className="text-[11px] text-danger">Période invalide.</p>
      ) : (
        <p className="text-[11px] text-muted">
          {dayCount} jour{dayCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
