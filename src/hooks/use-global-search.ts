"use client";

import * as React from "react";

import { useFarmState_unsafe } from "@/contexts/farm-store";
import {
  buildGlobalSearchIndex,
  searchGlobalIndex,
  selectFarmSearchData,
  type GlobalSearchResult,
} from "@/lib/global-search";

/**
 * Index mémoïsé — recalculé à chaque changement store (local ou Supabase).
 */
export function useGlobalSearchIndex() {
  const state = useFarmState_unsafe();

  return React.useMemo(
    () => buildGlobalSearchIndex(selectFarmSearchData(state)),
    [
      state.productions,
      state.ventes,
      state.depenses,
      state.tresorerie,
      state.actions,
      state.config,
    ]
  );
}

export function useGlobalSearch(query: string): GlobalSearchResult {
  const index = useGlobalSearchIndex();
  return React.useMemo(
    () => searchGlobalIndex(index, query),
    [index, query]
  );
}
