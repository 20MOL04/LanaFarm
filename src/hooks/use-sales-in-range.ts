"use client";

import { useSalesStore } from "@/contexts/farm-store";
import { useEntriesInRange } from "@/hooks/use-entries-in-range";
import type { Vente } from "@/types/domain";

/** Ventes intersectant la plage globale. */
export function useSalesInRange(): Vente[] {
  const { state } = useSalesStore();
  return useEntriesInRange(state.ventes);
}
