"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";

import { ComboboxCategorie } from "@/components/shared/combobox-categorie";
import {
  MULTI_DAY_INPUT_PRICE,
  MULTI_DAY_INPUT_TEXT,
  MULTI_DAY_TABLE,
} from "@/components/shared/form-dialog-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasActiveDepensesForDay } from "@/lib/multi-day";
import { cn } from "@/lib/utils";
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
    <div className={MULTI_DAY_TABLE.wrap}>
      <table className={MULTI_DAY_TABLE.root}>
        <thead>
          <tr className="border-b border-border bg-card-muted text-[10px] font-medium text-muted">
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.day)}>Jour</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.category)}>Catégorie</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.montant)}>Montant (GNF)</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.description)}>
              Description (optionnel)
            </th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.action)} />
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, blockIndex) => {
            const dayLabel = format(new Date(block.jourISO), "EEE d/MM", { locale: fr });
            const hasConflict = hasActiveDepensesForDay(depenses, block.jourISO);
            return block.lignes.map((ligne, lineIndex) => (
              <tr
                key={`${block.jourISO}-${lineIndex}`}
                className={cn(
                  "border-b border-border last:border-0",
                  isExpenseBlockFilled(block) && "bg-card"
                )}
              >
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.day, "align-top")}>
                  {lineIndex === 0 ? (
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="font-medium capitalize text-foreground">{dayLabel}</span>
                      {hasConflict ? (
                        <Badge tone="warning" className="w-fit text-[10px]">
                          Déjà saisi
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-0.5 h-6 w-fit px-1 text-[10px]"
                        onClick={() => addLine(blockIndex)}
                      >
                        <Plus className="h-3 w-3" />
                        Ligne
                      </Button>
                    </div>
                  ) : null}
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.category)}>
                  <div className="min-w-0 [&_input]:h-8 [&_input]:min-w-0 [&_input]:px-1.5 [&_input]:text-[13px]">
                    <ComboboxCategorie
                      value={ligne.categorie}
                      onChange={(v) => updateLine(blockIndex, lineIndex, { categorie: v })}
                      categories={config.listes.categoriesDepense}
                      placeholder="Catégorie"
                    />
                  </div>
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.montant)}>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    inputMode="numeric"
                    value={ligne.montant || ""}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      updateLine(blockIndex, lineIndex, {
                        montant: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_PRICE}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.description)}>
                  <Input
                    value={ligne.description}
                    onChange={(e) =>
                      updateLine(blockIndex, lineIndex, { description: e.target.value })
                    }
                    placeholder="Optionnel"
                    className={MULTI_DAY_INPUT_TEXT}
                    maxLength={240}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.action, "align-top")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeLine(blockIndex, lineIndex)}
                    disabled={block.lignes.length <= 1}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted" />
                  </Button>
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
