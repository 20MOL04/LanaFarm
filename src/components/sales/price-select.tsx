"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatGNF } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PRIX_SUGGERES_GNF } from "@/types/domain";

type PriceSelectProps = {
  id?: string;
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void;
  defaultPrix?: number;
  suggestions?: number[];
  required?: boolean;
};

/**
 * Prix : un seul champ numérique + pastilles de suggestion.
 * « Autre prix » = focus clavier sur le même champ (pas de 2e input).
 */
export function PriceSelect({
  id = "price-input",
  value,
  onChange,
  onBlur,
  defaultPrix,
  suggestions = PRIX_SUGGERES_GNF,
  required,
}: PriceSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const priceOptions = React.useMemo(() => {
    const set = new Set<number>();
    if (defaultPrix != null && defaultPrix > 0) set.add(defaultPrix);
    for (const p of suggestions) {
      if (p > 0) set.add(p);
    }
    return [...set].sort((a, b) => a - b);
  }, [defaultPrix, suggestions]);

  return (
    <div className="min-w-0 space-y-2">
      <Input
        ref={inputRef}
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={500}
        required={required}
        value={Number.isFinite(value) && value > 0 ? value : ""}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === "") {
            onChange(0);
            return;
          }
          const n = parseInt(raw, 10);
          onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
        }}
        onBlur={onBlur}
        onFocus={(e) => e.currentTarget.select()}
        placeholder="Prix casier (GNF)"
        aria-label="Prix casier en GNF"
        className="h-9 w-full min-w-0 tabular-nums"
      />

      <div className="flex min-w-0 flex-wrap gap-1.5">
        {priceOptions.map((p) => {
          const active = value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                inputRef.current?.focus();
              }}
              className={cn(
                "rounded-pill border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors",
                active
                  ? "border-accent-blue bg-accent-blue text-white"
                  : "border-border bg-card text-foreground hover:bg-card-muted"
              )}
            >
              {formatGNF(p)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="rounded-pill border border-dashed border-border px-2 py-0.5 text-[11px] font-medium text-muted hover:border-accent-blue hover:text-accent-blue"
        >
          Autre prix
        </button>
      </div>
    </div>
  );
}
