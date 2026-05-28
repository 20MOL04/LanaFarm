"use client";

import { useExpensesStore } from "@/contexts/farm-store";
import { useEntriesInRange } from "@/hooks/use-entries-in-range";
import type { Depense } from "@/types/domain";

/** Dépenses intersectant la plage globale. */
export function useExpensesInRange(): Depense[] {
  const { state } = useExpensesStore();
  return useEntriesInRange(state.depenses);
}
