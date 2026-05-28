"use client";

import * as React from "react";

import { useDateRange } from "@/contexts/date-range-context";

export type EntriesInRangeOptions<T> = {
  /** Si false, exclut les entrées archivées. Par défaut : tout inclure. */
  includeArchived?: boolean;
  /** Date opérationnelle (défaut : `entry.jourISO` si présent). */
  getJourISO?: (entry: T) => string;
  /** Filtre archivé personnalisé (défaut : `statut === "archive"` quand la propriété existe). */
  isArchived?: (entry: T) => boolean;
};

function defaultIsArchived(entry: unknown): boolean {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "statut" in entry &&
    (entry as { statut: unknown }).statut === "archive"
  );
}

/**
 * Filtre les entrées métier sur la plage globale (`DateRangeContext`).
 * Inclut annulées et archivées par défaut — les agrégats ignorent les annulées côté lib.
 */
export function useEntriesInRange<T>(
  entries: T[],
  options?: EntriesInRangeOptions<T>
): T[] {
  const { range } = useDateRange();
  const getJourISO = options?.getJourISO;
  const includeArchived = options?.includeArchived;
  const isArchived = options?.isArchived ?? defaultIsArchived;

  return React.useMemo(() => {
    const from = range.from.getTime();
    const to = range.to.getTime();

    return entries.filter((entry) => {
      if (includeArchived === false && isArchived(entry)) {
        return false;
      }

      const iso =
        getJourISO?.(entry) ??
        (typeof entry === "object" &&
        entry !== null &&
        "jourISO" in entry &&
        typeof (entry as { jourISO: unknown }).jourISO === "string"
          ? (entry as { jourISO: string }).jourISO
          : "");

      if (!iso) return false;

      const t = new Date(iso).getTime();
      return t >= from && t <= to;
    });
  }, [entries, range, includeArchived, getJourISO, isArchived]);
}
