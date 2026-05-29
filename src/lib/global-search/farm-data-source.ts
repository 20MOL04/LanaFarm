import type {
  ActionLog,
  Depense,
  FarmConfig,
  Production,
  Tresorerie,
  Vente,
} from "@/types/domain";

/**
 * Snapshot des données métier pour l'index de recherche.
 *
 * Source unique côté client : `FarmStoreProvider` (localStorage ou Supabase
 * via `/api/farm/state`). Toute modification store → index recalculé.
 */
export type FarmSearchDataSource = {
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
  actions: ActionLog[];
  config: FarmConfig;
};

export type FarmSearchDataSlice = keyof FarmSearchDataSource;
