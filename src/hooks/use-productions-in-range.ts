"use client";

import { useProductionStore } from "@/contexts/farm-store";
import { useEntriesInRange } from "@/hooks/use-entries-in-range";
import type { Production } from "@/types/domain";

/**
 * Productions intersectant la plage globale (annulées incluses pour le filtre UI).
 */
export function useProductionsInRange(): Production[] {
  const { state } = useProductionStore();
  return useEntriesInRange(state.productions);
}
