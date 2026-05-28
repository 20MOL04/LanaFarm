"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
    <div className="min-w-0 overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-card-muted text-[10px] font-medium uppercase tracking-wide text-muted">
            <th className="px-2 py-2">Jour</th>
            <th className="px-2 py-2">Ramassées (alv.)</th>
            <th className="px-2 py-2">Mises en vente (alv.)</th>
            <th className="px-2 py-2">Cassés (œufs)</th>
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
                <td className="px-2 py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium capitalize text-foreground">{dayLabel}</span>
                    {hasConflict ? (
                      <Badge tone="warning" className="w-fit text-[10px]">
                        Jour déjà saisi
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-1.5">
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
                    className="h-8 tabular-nums"
                  />
                </td>
                <td className="px-2 py-1.5">
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
                    className="h-8 tabular-nums"
                  />
                </td>
                <td className="px-2 py-1.5">
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
                    className="h-8 tabular-nums"
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
