"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { PriceSelect } from "@/components/sales/price-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getActiveVentesForDay } from "@/lib/multi-day";
import { cn } from "@/lib/utils";
import type { Vente } from "@/types/domain";

export type SalesMultiDayLine = {
  jourISO: string;
  alveoles: number;
  prix: number;
  client: string;
  cassesAlveoles: number;
};

export function isSalesMultiLineFilled(line: SalesMultiDayLine): boolean {
  return line.alveoles > 0;
}

type Props = {
  lines: SalesMultiDayLine[];
  ventes: Vente[];
  defaultPrix: number;
  onChange: (lines: SalesMultiDayLine[]) => void;
};

export function SalesMultiDayForm({ lines, ventes, defaultPrix, onChange }: Props) {
  const updateLine = (index: number, patch: Partial<SalesMultiDayLine>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  return (
    <>
      <div className="min-w-0 space-y-2 md:hidden">
        {lines.map((line, index) => {
          const dayLabel = format(new Date(line.jourISO), "EEE d MMM", { locale: fr });
          const hasConflict = getActiveVentesForDay(ventes, line.jourISO).length > 0;
          return (
            <div
              key={line.jourISO}
              className={cn(
                "min-w-0 space-y-2 rounded-card border border-border p-3",
                isSalesMultiLineFilled(line) && "bg-card"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium capitalize text-foreground">{dayLabel}</span>
                {hasConflict ? (
                  <Badge tone="warning" className="text-[10px]">
                    Jour déjà saisi
                  </Badge>
                ) : null}
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <label className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
                  <span className="text-[10px] font-medium uppercase text-muted">Alvéoles</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={line.alveoles}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const n = raw === "" ? 0 : parseInt(raw, 10);
                      updateLine(index, {
                        alveoles: Number.isNaN(n) ? 0 : Math.max(0, n),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-9 w-full min-w-0 tabular-nums"
                  />
                </label>
                <label className="col-span-2 min-w-0 space-y-1">
                  <span className="text-[10px] font-medium uppercase text-muted">Prix</span>
                  <PriceSelect
                    id={`sale-multi-price-${index}`}
                    value={line.prix}
                    defaultPrix={defaultPrix}
                    onChange={(prix) => updateLine(index, { prix })}
                  />
                </label>
                <label className="col-span-2 min-w-0 space-y-1">
                  <span className="text-[10px] font-medium uppercase text-muted">Client</span>
                  <Input
                    type="text"
                    value={line.client}
                    onChange={(e) => updateLine(index, { client: e.target.value })}
                    placeholder="Client"
                    className="h-9 w-full min-w-0"
                  />
                </label>
                <label className="min-w-0 space-y-1">
                  <span className="text-[10px] font-medium uppercase text-muted">Cassés</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={line.cassesAlveoles}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      updateLine(index, {
                        cassesAlveoles: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-9 w-full min-w-0 tabular-nums"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden min-w-0 overflow-x-auto rounded-card border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-card-muted text-[10px] font-medium uppercase tracking-wide text-muted">
              <th className="px-2 py-2">Jour</th>
              <th className="px-2 py-2">Alvéoles</th>
              <th className="px-2 py-2">Prix</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2">Cassés</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const dayLabel = format(new Date(line.jourISO), "EEE d/MM", { locale: fr });
              const hasConflict = getActiveVentesForDay(ventes, line.jourISO).length > 0;
              return (
                <tr
                  key={line.jourISO}
                  className={cn(
                    "border-b border-border last:border-0",
                    isSalesMultiLineFilled(line) && "bg-card"
                  )}
                >
                  <td className="px-2 py-1.5 align-top">
                    <div className="flex flex-col gap-0.5 pt-1">
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
                      value={line.alveoles}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const n = raw === "" ? 0 : parseInt(raw, 10);
                        updateLine(index, {
                          alveoles: Number.isNaN(n) ? 0 : Math.max(0, n),
                        });
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-8 tabular-nums"
                    />
                  </td>
                  <td className="min-w-[10rem] px-2 py-1.5">
                    <PriceSelect
                      id={`sale-multi-price-dt-${index}`}
                      value={line.prix}
                      defaultPrix={defaultPrix}
                      onChange={(prix) => updateLine(index, { prix })}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="text"
                      value={line.client}
                      onChange={(e) => updateLine(index, { client: e.target.value })}
                      placeholder="Client"
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={line.cassesAlveoles}
                      onChange={(e) => {
                        const n = e.target.valueAsNumber;
                        updateLine(index, {
                          cassesAlveoles: Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)),
                        });
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-8 w-20 tabular-nums"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
