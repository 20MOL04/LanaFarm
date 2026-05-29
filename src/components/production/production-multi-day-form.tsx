"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  MULTI_DAY_INPUT_NUM,
  MULTI_DAY_TABLE,
} from "@/components/shared/form-dialog-styles";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { findActiveProductionForDay } from "@/lib/multi-day";
import { cn } from "@/lib/utils";
import type { Production } from "@/types/domain";

export type ProductionMultiDayLine = {
  jourISO: string;
  alveolesRamassees: number;
  alveolesMisesEnVente: number;
  oeufsCasses: number;
};

export function isProductionMultiLineFilled(line: ProductionMultiDayLine): boolean {
  return line.alveolesRamassees > 0 || line.alveolesMisesEnVente > 0;
}

type Props = {
  lines: ProductionMultiDayLine[];
  productions: Production[];
  onChange: (lines: ProductionMultiDayLine[]) => void;
};

export function ProductionMultiDayForm({ lines, productions, onChange }: Props) {
  const updateLine = (index: number, patch: Partial<ProductionMultiDayLine>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  return (
    <div className={MULTI_DAY_TABLE.wrap}>
      <table className={MULTI_DAY_TABLE.root}>
        <thead>
          <tr className="border-b border-border bg-card-muted text-caption font-medium text-muted">
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.day)}>Jour</th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.ramassees)}>
              Ramassées (alv.)
            </th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.misesEnVente)}>
              Mises en vente (alv.)
            </th>
            <th className={cn(MULTI_DAY_TABLE.th, MULTI_DAY_TABLE.col.cassesOeufs)}>
              Cassés (œufs)
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const dayLabel = format(new Date(line.jourISO), "EEE d/MM", { locale: fr });
            const hasConflict = !!findActiveProductionForDay(productions, line.jourISO);
            return (
              <tr
                key={line.jourISO}
                className={cn(
                  "border-b border-border last:border-0",
                  isProductionMultiLineFilled(line) && "bg-card"
                )}
              >
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.day)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium capitalize text-foreground">{dayLabel}</span>
                    {hasConflict ? (
                      <Badge tone="warning" className="w-fit text-caption">
                        Jour déjà saisi
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.ramassees)}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={line.alveolesRamassees}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      updateLine(index, {
                        alveolesRamassees: Number.isNaN(n) ? 0 : Math.max(0, n),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_NUM}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.misesEnVente)}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={line.alveolesMisesEnVente}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      updateLine(index, {
                        alveolesMisesEnVente: Number.isNaN(n) ? 0 : Math.max(0, n),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_NUM}
                  />
                </td>
                <td className={cn(MULTI_DAY_TABLE.td, MULTI_DAY_TABLE.col.cassesOeufs)}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={line.oeufsCasses}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      updateLine(index, {
                        oeufsCasses: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className={MULTI_DAY_INPUT_NUM}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
