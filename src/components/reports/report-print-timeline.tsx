"use client";

import { formatGNF } from "@/lib/format";
import type { ActivityPoint } from "@/lib/dashboard-calc";

type Props = {
  data: ActivityPoint[];
};

/**
 * Tableau activité pour l'impression (remplace Recharts, souvent mal rendu).
 */
export function ReportPrintTimeline({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="hidden text-xs text-muted print:block">
        Aucune activité sur la période.
      </p>
    );
  }

  const visible = data.slice(-14);

  return (
    <div className="hidden print:block print:break-inside-avoid">
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Activité journalière
      </h2>
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-1 pr-2 font-medium">Jour</th>
            <th className="py-1 pr-2 text-right font-medium">CA</th>
            <th className="py-1 pr-2 text-right font-medium">Depenses</th>
            <th className="py-1 pr-2 text-right font-medium">Profit</th>
            <th className="py-1 text-right font-medium">Prod. (alv.)</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.dateISO} className="border-b border-border/60">
              <td className="py-1 pr-2 capitalize">
                {new Date(row.dateISO).toLocaleDateString("fr-GN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </td>
              <td className="py-1 pr-2 text-right tabular-nums">
                {formatGNF(row.ca)}
              </td>
              <td className="py-1 pr-2 text-right tabular-nums">
                {formatGNF(row.depenses)}
              </td>
              <td className="py-1 pr-2 text-right tabular-nums">
                {formatGNF(row.profit)}
              </td>
              <td className="py-1 tabular-nums text-right">
                {Math.round(row.production)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
