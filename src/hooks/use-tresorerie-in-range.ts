"use client";

import { useTresorerieStore } from "@/contexts/farm-store";
import { useEntriesInRange } from "@/hooks/use-entries-in-range";
import type { Tresorerie } from "@/types/domain";

/** Saisies trésorerie intersectant la plage globale. */
export function useTresorerieInRange(): Tresorerie[] {
  const { state } = useTresorerieStore();
  return useEntriesInRange(state.tresorerie);
}
