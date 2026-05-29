export type {
  GlobalSearchEntry,
  GlobalSearchEntryKind,
  GlobalSearchGroup,
  GlobalSearchResult,
} from "@/lib/global-search/types";

export type { FarmSearchDataSource } from "@/lib/global-search/farm-data-source";

export { buildGlobalSearchIndex } from "@/lib/global-search/build-index";
export { searchGlobalIndex } from "@/lib/global-search/search";
export { normalizeSearchText, tokenizeQuery } from "@/lib/global-search/normalize";
export { parseSearchDate, parseSearchAmount, formatSearchDayLabel } from "@/lib/global-search/parse-query";

/**
 * Sélectionne le snapshot store pour l'index de recherche.
 * Même payload que Supabase `/api/farm/state` — une seule source synchronisée.
 */
export function selectFarmSearchData(state: {
  productions: import("@/types/domain").Production[];
  ventes: import("@/types/domain").Vente[];
  depenses: import("@/types/domain").Depense[];
  tresorerie: import("@/types/domain").Tresorerie[];
  actions: import("@/types/domain").ActionLog[];
  config: import("@/types/domain").FarmConfig;
}): import("@/lib/global-search/farm-data-source").FarmSearchDataSource {
  return {
    productions: state.productions,
    ventes: state.ventes,
    depenses: state.depenses,
    tresorerie: state.tresorerie,
    actions: state.actions,
    config: state.config,
  };
}
