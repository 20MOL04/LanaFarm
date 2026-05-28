/**
 * Agrégats légers pour le module Historique.
 * Pas de duplication : se contente de compter les actions par type/module.
 */

import type { ActionLog, ActionType, Module } from "@/types/domain";

export type HistoryCounters = {
  total: number;
  modifications: number;
  annulations: number;
  validations: number;
  /** Bonus — affichables dans des secondaries futurs. */
  creations: number;
  restaurations: number;
  reouvertures: number;
  /** Répartition par module — pour analytics futurs. */
  byModule: Partial<Record<Module, number>>;
};

const EMPTY_COUNTERS = (): HistoryCounters => ({
  total: 0,
  modifications: 0,
  annulations: 0,
  validations: 0,
  creations: 0,
  restaurations: 0,
  reouvertures: 0,
  byModule: {},
});

export function buildHistoryCounters(actions: ActionLog[]): HistoryCounters {
  const out = EMPTY_COUNTERS();
  for (const a of actions) {
    out.total += 1;
    if (a.type === "modification") out.modifications += 1;
    else if (a.type === "annulation") out.annulations += 1;
    else if (a.type === "validation") out.validations += 1;
    else if (a.type === "creation") out.creations += 1;
    else if (a.type === "restauration") out.restaurations += 1;
    else if (a.type === "reouverture") out.reouvertures += 1;
    out.byModule[a.module] = (out.byModule[a.module] ?? 0) + 1;
  }
  return out;
}

/**
 * Renvoie les actions intersectant une période donnée [from, to].
 * Helper pur — utilisé par le hook `useActionsInRange`.
 */
export function filterActionsInRange(
  actions: ActionLog[],
  from: Date,
  to: Date
): ActionLog[] {
  const f = from.getTime();
  const t = to.getTime();
  return actions.filter((a) => {
    const ts = new Date(a.dateISO).getTime();
    return ts >= f && ts <= t;
  });
}

/* ===========================================================
   Filtres typés (utilisés par UI) — exposés ici pour rester
   testables sans React.
   =========================================================== */

export type ModuleFilter = "tous" | Module;
export type TypeFilter = "tous" | ActionType;

export function applyHistoryFilters(
  actions: ActionLog[],
  filters: { module: ModuleFilter; type: TypeFilter }
): ActionLog[] {
  return actions.filter((a) => {
    if (filters.module !== "tous" && a.module !== filters.module) return false;
    if (filters.type !== "tous" && a.type !== filters.type) return false;
    return true;
  });
}
