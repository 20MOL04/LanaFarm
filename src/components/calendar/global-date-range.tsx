"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { Calendar, Check, ChevronDown } from "lucide-react";

import { DateInput } from "@/components/shared/date-input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useDateRange } from "@/contexts/date-range-context";
import { formatRange, rangeFromIsoDates, toIsoDate } from "@/lib/date-ranges";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de plage global — presets courts + personnalisé (Du/Au).
 */
export function GlobalDateRange({ className }: { className?: string }) {
  const { range, presetId, presets, setPreset, setCustomRange } = useDateRange();
  const [open, setOpen] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState(() => toIsoDate(range.from));
  const [customTo, setCustomTo] = React.useState(() => toIsoDate(range.to));

  React.useEffect(() => {
    if (!open) return;
    setCustomFrom(toIsoDate(range.from));
    setCustomTo(toIsoDate(range.to));
  }, [open, range.from, range.to]);

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    setCustomRange(rangeFromIsoDates(customFrom, customTo));
    setOpen(false);
  };

  const todayIso = format(startOfDay(new Date()), "yyyy-MM-dd");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 rounded-button border border-border bg-card px-2.5 text-[13px] text-foreground sm:px-3",
          "hover:bg-card-muted transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue/40",
          className
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted" />
        <span className="min-w-0 truncate font-medium">{formatRange(range)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </PopoverTrigger>

      <PopoverContent className="w-[min(100vw-1.5rem,18rem)] p-0" align="end">
        <ul className="p-1">
          {presets.map((preset) => {
            const active = preset.id === presetId;
            const isCustom = preset.id === "custom";
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (isCustom) {
                      setPreset("custom");
                      return;
                    }
                    setPreset(preset.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm",
                    "text-foreground hover:bg-card-muted transition-colors",
                    active && "bg-card-muted font-medium"
                  )}
                >
                  <span>{preset.label}</span>
                  {active ? <Check className="h-4 w-4 text-accent-blue" /> : null}
                </button>
              </li>
            );
          })}
        </ul>

        {presetId === "custom" ? (
          <>
            <Separator />
            <div className="space-y-2 p-3">
              <label className="block min-w-0 space-y-1">
                <span className="text-[10px] font-medium uppercase text-muted">Du</span>
                <DateInput
                  value={customFrom}
                  max={customTo || todayIso}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label className="block min-w-0 space-y-1">
                <span className="text-[10px] font-medium uppercase text-muted">Au</span>
                <DateInput
                  value={customTo}
                  min={customFrom}
                  max={todayIso}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="accent"
                size="sm"
                className="w-full"
                onClick={applyCustom}
              >
                Appliquer
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
