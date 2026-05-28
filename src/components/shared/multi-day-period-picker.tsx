"use client";

import { CalendarDays } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-2 rounded-card border border-border bg-card-muted/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Période
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Du" htmlFor="multi-from" required>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="multi-from"
              type="date"
              value={fromIso}
              max={maxDateIso}
              onChange={(e) => onFromChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </FormField>
        <FormField label="Au" htmlFor="multi-to" required>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="multi-to"
              type="date"
              value={toIso}
              min={fromIso}
              max={maxDateIso}
              onChange={(e) => onToChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
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
