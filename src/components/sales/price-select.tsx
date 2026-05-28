"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGNF } from "@/lib/format";
import { PRIX_SUGGERES_GNF } from "@/types/domain";

const CUSTOM_OPTION = "__custom__";

type PriceSelectProps = {
  id?: string;
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void;
  /** Prix par défaut (config) en tête de liste. */
  defaultPrix?: number;
  /** Prix suggérés additionnels. */
  suggestions?: number[];
  required?: boolean;
};

/**
 * Sélecteur de prix compact : dropdown + option « Autre prix… »
 * avec saisie libre inline (B-UX1).
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
  const priceOptions = React.useMemo(() => {
    const set = new Set<number>();
    if (defaultPrix != null && defaultPrix > 0) set.add(defaultPrix);
    for (const p of suggestions) {
      if (p > 0) set.add(p);
    }
    return [...set].sort((a, b) => a - b);
  }, [defaultPrix, suggestions]);

  const isKnownPrice = value > 0 && priceOptions.includes(value);
  const [customMode, setCustomMode] = React.useState(!isKnownPrice && value > 0);

  React.useEffect(() => {
    if (value > 0 && priceOptions.includes(value)) {
      setCustomMode(false);
    }
  }, [value, priceOptions]);

  const selectValue = customMode ? CUSTOM_OPTION : value > 0 ? String(value) : "";

  const handleSelectChange = (v: string) => {
    if (v === CUSTOM_OPTION) {
      setCustomMode(true);
      if (value <= 0 && defaultPrix) onChange(defaultPrix);
      return;
    }
    setCustomMode(false);
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) onChange(n);
  };

  return (
    <div className="space-y-1.5">
      <Select value={selectValue || undefined} onValueChange={handleSelectChange}>
        <SelectTrigger id={id} className="h-9 tabular-nums">
          <SelectValue placeholder="Prix casier (GNF)" />
        </SelectTrigger>
        <SelectContent>
          {priceOptions.map((p) => (
            <SelectItem key={p} value={String(p)}>
              {formatGNF(p)}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_OPTION}>Autre prix…</SelectItem>
        </SelectContent>
      </Select>

      {customMode ? (
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          required={required}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            onChange(Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)));
          }}
          onBlur={onBlur}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 tabular-nums"
          placeholder="Autre montant..."
          aria-label="Autre prix en GNF"
        />
      ) : null}
    </div>
  );
}
