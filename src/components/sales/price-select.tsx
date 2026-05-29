"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
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
  className?: string;
};

/**
 * Un seul champ prix : saisie libre + menu de suggestions au focus (pas de 2e champ ni pastilles).
 */
export function PriceSelect({
  id = "price-input",
  value,
  onChange,
  onBlur,
  defaultPrix,
  suggestions = PRIX_SUGGERES_GNF,
  required,
  className,
}: PriceSelectProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const priceOptions = React.useMemo(() => {
    const set = new Set<number>();
    if (defaultPrix != null && defaultPrix > 0) set.add(defaultPrix);
    for (const p of suggestions) {
      if (p > 0) set.add(p);
    }
    return [...set].sort((a, b) => a - b);
  }, [defaultPrix, suggestions]);

  const pickPrice = (p: number) => {
    onChange(p);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
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
          onBlur={(e) => {
            onBlur?.();
            window.setTimeout(() => {
              if (!inputRef.current?.matches(":focus")) setOpen(false);
            }, 120);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder="GNF"
          aria-label="Prix casier en GNF"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn("h-8 w-full min-w-0 tabular-nums", className)}
        />
      </PopoverAnchor>
      <PopoverContent
        className="z-[100] w-[min(100vw-2rem,var(--radix-popover-trigger-width,12rem))] p-1"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <ul
          role="listbox"
          className="max-h-48 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
          {priceOptions.map((p) => (
            <li key={p}>
              <button
                type="button"
                role="option"
                aria-selected={value === p}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickPrice(p)}
                className={cn(
                  "flex w-full rounded-sm px-2.5 py-1.5 text-left text-sm tabular-nums",
                  "hover:bg-card-muted",
                  value === p && "bg-card-muted font-medium"
                )}
              >
                {formatGNF(p)}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
