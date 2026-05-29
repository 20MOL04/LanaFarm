"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";

import { PriceSelect } from "@/components/sales/price-select";
import {
  MULTI_DAY_INPUT_NUM,
  MULTI_DAY_INPUT_PRICE,
  MULTI_DAY_INPUT_TEXT,
  MULTI_DAY_TABLE,
} from "@/components/shared/form-dialog-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import { getActiveVentesForDay } from "@/lib/multi-day";
import { cn } from "@/lib/utils";
import type { Vente } from "@/types/domain";

export type SalesMultiDayLine = {
  alveoles: number;
  prix: number;
  client: string;
};

export type SalesMultiDayBlock = {
  jourISO: string;
  lignes: SalesMultiDayLine[];
  cassesAlveoles: number;
};

export function emptySalesMultiLine(defaultPrix: number): SalesMultiDayLine {
  return { alveoles: 0, prix: defaultPrix, client: "" };
}

export function emptySalesMultiBlock(jourISO: string, defaultPrix: number): SalesMultiDayBlock {
  return {
    jourISO,
    lignes: [emptySalesMultiLine(defaultPrix)],
    cassesAlveoles: 0,
  };
}

export function isSalesBlockFilled(block: SalesMultiDayBlock): boolean {
  return block.lignes.some((l) => l.alveoles > 0);
}

type Props = {
  blocks: SalesMultiDayBlock[];
  ventes: Vente[];
  defaultPrix: number;
  onChange: (blocks: SalesMultiDayBlock[]) => void;
};

export function SalesMultiDayForm({ blocks, ventes, defaultPrix, onChange }: Props) {
  const updateBlock = (blockIndex: number, next: SalesMultiDayBlock) => {
    onChange(blocks.map((b, i) => (i === blockIndex ? next : b)));
  };

  const updateLine = (
    blockIndex: number,
    lineIndex: number,
    patch: Partial<SalesMultiDayLine>
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
      lignes: [...block.lignes, emptySalesMultiLine(defaultPrix)],
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
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.vendus)}>Vendus (alv.)</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.prix)}>
              Prix (GNF/alv.)
            </th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.client)}>
              Client (optionnel)
            </th>
            {SHOW_VENTE_CASSES ? (
              <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.cassesAlv)}>
                Cassés (alv.)
              </th>
            ) : null}
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.action)} />
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, blockIndex) => {
            const dayLabel = format(new Date(block.jourISO), "EEE d/MM", { locale: fr });
            const hasConflict = getActiveVentesForDay(ventes, block.jourISO).length > 0;
            return block.lignes.map((ligne, lineIndex) => (
              <tr
                key={`${block.jourISO}-${lineIndex}`}
                className={cn(
                  "border-b border-border last:border-0",
                  isSalesBlockFilled(block) && "bg-card"
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
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.vendus)}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={ligne.alveoles || ""}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      updateLine(blockIndex, lineIndex, {
                        alveoles: Number.isNaN(n) ? 0 : Math.max(0, n),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_NUM}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.prix)}>
                  <PriceSelect
                    id={`sale-multi-price-${blockIndex}-${lineIndex}`}
                    value={ligne.prix}
                    defaultPrix={defaultPrix}
                    onChange={(prix) => updateLine(blockIndex, lineIndex, { prix })}
                    className={MULTI_DAY_INPUT_PRICE}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.client)}>
                  <Input
                    type="text"
                    value={ligne.client}
                    onChange={(e) =>
                      updateLine(blockIndex, lineIndex, { client: e.target.value })
                    }
                    placeholder="Optionnel"
                    className={MULTI_DAY_INPUT_TEXT}
                  />
                </td>
                {SHOW_VENTE_CASSES ? (
                  lineIndex === 0 ? (
                    <td
                      rowSpan={block.lignes.length}
                      className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.cassesAlv, "align-top")}
                    >
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={block.cassesAlveoles || ""}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          updateBlock(blockIndex, {
                            ...block,
                            cassesAlveoles: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                          });
                        }}
                        onFocus={(e) => e.currentTarget.select()}
                        className={MULTI_DAY_INPUT_NUM}
                      />
                    </td>
                  ) : null
                ) : null}
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.action)}>
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
