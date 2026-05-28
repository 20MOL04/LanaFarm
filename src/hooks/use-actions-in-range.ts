"use client";

import * as React from "react";

import { useDateRange } from "@/contexts/date-range-context";
import { useFarmState_unsafe } from "@/contexts/farm-store";
import { filterActionsInRange } from "@/lib/history-calc";
import type { ActionLog } from "@/types/domain";

/**
 * Renvoie les entrées du journal d'actions intersectant la plage globale.
 * Lecture seule — le journal est écrit par les reducers des modules.
 */
export function useActionsInRange(): ActionLog[] {
  const state = useFarmState_unsafe();
  const { range } = useDateRange();
  return React.useMemo(
    () => filterActionsInRange(state.actions, range.from, range.to),
    [state.actions, range]
  );
}
