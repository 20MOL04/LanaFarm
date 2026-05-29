"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";

import { ComboboxMethode } from "@/components/shared/combobox-methode";
import {
  MULTI_DAY_INPUT_PRICE,
  MULTI_DAY_TABLE,
} from "@/components/shared/form-dialog-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasActiveTresorerieForDay } from "@/lib/multi-day";
import { cn } from "@/lib/utils";
import type { FarmConfig, Tresorerie } from "@/types/domain";

export type TresorerieMultiDayLine = {
  methode: string;
  montantRecu: number;
};

export type TresorerieMultiDayBlock = {
  jourISO: string;
  lignes: TresorerieMultiDayLine[];
};

function emptyTresorerieLine(): TresorerieMultiDayLine {
  return { methode: "", montantRecu: 0 };
}

export function isTresorerieBlockFilled(block: TresorerieMultiDayBlock): boolean {
  return block.lignes.some(
    (l) => l.methode.trim().length > 0 && l.montantRecu > 0
  );
}

type Props = {
  blocks: TresorerieMultiDayBlock[];
  tresorerie: Tresorerie[];
  config: FarmConfig;
  onChange: (blocks: TresorerieMultiDayBlock[]) => void;
};

export function TresorerieMultiDayForm({
  blocks,
  tresorerie,
  config,
  onChange,
}: Props) {
  const updateBlock = (blockIndex: number, next: TresorerieMultiDayBlock) => {
    onChange(blocks.map((b, i) => (i === blockIndex ? next : b)));
  };

  const updateLine = (
    blockIndex: number,
    lineIndex: number,
    patch: Partial<TresorerieMultiDayLine>
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
      lignes: [...block.lignes, emptyTresorerieLine()],
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
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.category)}>Méthode</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.montant)}>Montant versé</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.action)} />
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, blockIndex) => {
            const dayLabel = format(new Date(block.jourISO), "EEE d/MM", { locale: fr });
            const hasConflict = hasActiveTresorerieForDay(tresorerie, block.jourISO);
            return block.lignes.map((ligne, lineIndex) => (
              <tr
                key={`${block.jourISO}-${lineIndex}`}
                className={cn(
                  "border-b border-border last:border-0",
                  isTresorerieBlockFilled(block) && "bg-card"
                )}
              >
                {lineIndex === 0 ? (
                  <td
                    rowSpan={block.lignes.length}
                    className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.day)}
                  >
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="text-[12px] font-medium capitalize leading-none text-foreground">
                        {dayLabel}
                      </span>
                      {hasConflict ? (
                        <Badge tone="warning" className="px-1 py-0 text-[9px] leading-tight">
                          Déjà saisi
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 text-[10px] leading-none"
                        onClick={() => addLine(blockIndex)}
                      >
                        <Plus className="h-3 w-3" />
                        Ligne
                      </Button>
                    </div>
                  </td>
                ) : null}
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.category)}>
                  <div className="min-w-0 [&_input]:h-8 [&_input]:min-w-0 [&_input]:px-1.5 [&_input]:text-[13px]">
                    <ComboboxMethode
                      value={ligne.methode}
                      onChange={(v) => updateLine(blockIndex, lineIndex, { methode: v })}
                      methodes={config.listes.methodesPaiement}
                      placeholder="Méthode"
                    />
                  </div>
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.montant)}>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    inputMode="numeric"
                    value={ligne.montantRecu || ""}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      updateLine(blockIndex, lineIndex, {
                        montantRecu: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_PRICE}
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
