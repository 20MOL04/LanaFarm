"use client";

import * as React from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useDateRange } from "@/contexts/date-range-context";
import { formatRange } from "@/lib/date-ranges";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de plage de dates global.
 * Pilote l'ensemble de l'application via le DateRangeProvider.
 */
export function GlobalDateRange({ className }: { className?: string }) {
  const { range, presetId, presets, setPreset } = useDateRange();
  const [open, setOpen] = React.useState(false);
  const activePresetLabel =
    presets.find((p) => p.id === presetId)?.label ?? "Plage";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 rounded-button border border-border bg-card px-2 text-[13px] text-foreground sm:gap-2 sm:px-3",
          "hover:bg-card-muted transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue/40",
          className
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted" />
        <span className="hidden shrink-0 text-muted sm:inline">{activePresetLabel}</span>
        <span className="min-w-0 truncate font-medium">{formatRange(range)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Filtre global
          </p>
          <p className="mt-1 text-xs text-muted">
            Modifie automatiquement toutes les pages.
          </p>
        </div>
        <Separator />
        <ul className="p-1">
          {presets.map((preset) => {
            const active = preset.id === presetId;
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => {
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
                  {active ? (
                    <Check className="h-4 w-4 text-accent-blue" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <Separator />
        <div className="p-3 text-[11px] text-muted">
          La sélection personnalisée sera disponible bientôt.
        </div>
      </PopoverContent>
    </Popover>
  );
}
