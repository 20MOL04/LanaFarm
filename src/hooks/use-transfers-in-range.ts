"use client";

import { useTransfersStore } from "@/contexts/farm-store";
import { useEntriesInRange } from "@/hooks/use-entries-in-range";
import type { TransfertStock } from "@/types/domain";

/** Transferts sur la plage, filtrés par `jourEnvoiISO`. */
export function useTransfersInRange(): TransfertStock[] {
  const { state } = useTransfersStore();
  return useEntriesInRange(state.transferts, {
    getJourISO: (t) => t.jourEnvoiISO,
  });
}
