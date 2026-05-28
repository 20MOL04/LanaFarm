"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CircleDollarSign, Plus, Trash2 } from "lucide-react";

import { ComboboxCategorie } from "@/components/shared/combobox-categorie";
import { FormField } from "@/components/shared/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasActiveDepensesForDay } from "@/lib/multi-day";
import type { Depense, FarmConfig } from "@/types/domain";

export type ExpenseMultiDayLine = {
  categorie: string;
  montant: number;
  description: string;
};

export type ExpenseMultiDayBlock = {
  jourISO: string;
  lignes: ExpenseMultiDayLine[];
};

function emptyExpenseLine(): ExpenseMultiDayLine {
  return { categorie: "", montant: 0, description: "" };
}

export function isExpenseBlockFilled(block: ExpenseMultiDayBlock): boolean {
  return block.lignes.some(
    (l) => l.categorie.trim().length > 0 && l.montant > 0
  );
}

type Props = {
  blocks: ExpenseMultiDayBlock[];
  depenses: Depense[];
  config: FarmConfig;
  onChange: (blocks: ExpenseMultiDayBlock[]) => void;
};

export function ExpensesMultiDayForm({ blocks, depenses, config, onChange }: Props) {
  const updateBlock = (blockIndex: number, next: ExpenseMultiDayBlock) => {
    onChange(blocks.map((b, i) => (i === blockIndex ? next : b)));
  };

  const updateLine = (
    blockIndex: number,
    lineIndex: number,
    patch: Partial<ExpenseMultiDayLine>
  ) => {
    const block = blocks[blockIndex];
    updateBlock(blockIndex, {
      ...block,
      lignes: block.lignes.map((l, i) => (i === lineIndex ? { ...l, ...patch } : l)),
    });
  };

  const addLine = (blockIndex: number) => {
    const block = blocks[blockIndex];
    updateBlock(blockIndex, {
      ...block,
      lignes: [...block.lignes, emptyExpenseLine()],
    });
  };

  const removeLine = (blockIndex: number, lineIndex: number) => {
    const block = blocks[blockIndex];
    if (block.lignes.length <= 1) return;
    updateBlock(blockIndex, {
      ...block,
      lignes: block.lignes.filter((_, i) => i !== lineIndex),
    });
  };

  return (
    <div className="max-h-[min(50vh,360px)] space-y-3 overflow-y-auto pr-1">
      {blocks.map((block, blockIndex) => {
        const dayLabel = format(new Date(block.jourISO), "EEEE d MMMM", { locale: fr });
        const hasConflict = hasActiveDepensesForDay(depenses, block.jourISO);
        return (
          <div
            key={block.jourISO}
            className="space-y-2 rounded-card border border-border bg-card-muted/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium capitalize text-foreground">{dayLabel}</p>
              {hasConflict ? (
                <Badge tone="warning" className="text-[10px]">
                  Jour déjà saisi
                </Badge>
              ) : null}
            </div>

            {block.lignes.map((ligne, lineIndex) => (
              <div
                key={lineIndex}
                className="space-y-2 rounded-sm border border-border/60 bg-card p-2"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label="Catégorie" required>
                    <ComboboxCategorie
                      value={ligne.categorie}
                      onChange={(v) => updateLine(blockIndex, lineIndex, { categorie: v })}
                      categories={config.listes.categoriesDepense}
                    />
                  </FormField>
                  <FormField label="Montant" required>
                    <div className="relative">
                      <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        type="number"
                        min={0}
                        step={500}
                        value={ligne.montant}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          updateLine(blockIndex, lineIndex, {
                            montant: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                          });
                        }}
                        onFocus={(e) => e.currentTarget.select()}
                        className="h-9 pl-9 tabular-nums"
                      />
                    </div>
                  </FormField>
                </div>
                <div className="flex items-end gap-2">
                  <FormField label="Description" className="min-w-0 flex-1">
                    <Input
                      value={ligne.description}
                      onChange={(e) =>
                        updateLine(blockIndex, lineIndex, { description: e.target.value })
                      }
                      placeholder="Optionnel"
                      className="h-9"
                      maxLength={240}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeLine(blockIndex, lineIndex)}
                    disabled={block.lignes.length <= 1}
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4 text-muted" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => addLine(blockIndex)}
            >
              <Plus className="h-3.5 w-3.5" />
              Ligne
            </Button>
          </div>
        );
      })}
    </div>
  );
}
