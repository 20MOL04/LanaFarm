/**
 * Agrégateur central du Dashboard.
 *
 * Source unique de vérité côté lecture : tous les KPI, séries et insights
 * dérivent des helpers existants (production-calc, sales-calc, expenses-calc,
 * tresorerie-calc, transfers-calc). Aucune duplication de logique métier.
 *
 * Utilisé par les composants du dashboard pour rester strictement déclaratifs.
 */

import { addDays, startOfDay, subDays } from "date-fns";

import {
  kpiAlveolesFerme,
  kpiAlveolesMisesEnVente,
  kpiAlveolesRamassees,
  kpiCA,
  kpiDepenses,
  kpiPertesTotales,
  kpiProfit,
  kpiResteAVerser,
  kpiStockMagasin,
  kpiTresorerieVersePeriode,
} from "@/lib/kpi-sources";
import { aggregateProductions } from "@/lib/production-calc";
import type {
  Depense,
  FarmConfig,
  Tresorerie,
  Production,
  TransfertStock,
  Vente,
} from "@/types/domain";

/* ===========================================================
   KPI Dashboard (8 cartes)
   =========================================================== */

export type DashboardKpiSnapshot = {
  /** Σ alvéoles ramassées sur la période. */
  alveolesRamassees: number;
  /** Σ alvéoles mises en vente sur la période. */
  alveolesMisesEnVente: number;
  /** Stock ferme instantané (alvéoles) — cumulatif, pas Σ période. */
  alveolesRestantes: number;
  /** Stock magasin cumulé à la fin de la période (œufs — afficher en alvéoles). */
  stockMagasin: number;
  /** Chiffre d'affaires sur la période. */
  chiffreAffaires: number;
  /** Dépenses sur la période. */
  totalDepenses: number;
  /** Profit = CA − Dépenses (peut être négatif). */
  profit: number;
  /** Pertes d'œufs : cassés ferme + cassés vente, sur la période. */
  pertesTotales: number;
  /** Œufs cassés ferme seuls. */
  oeufsCassesFerme: number;
  /** Argent réellement remis (déposé) sur la période. */
  montantRemis: number;
  /** Argent encaissé mais pas encore remis sur la période. */
  montantEnAttente: number;
};

export type DashboardAggregateInput = {
  productionsInRange: Production[];
  ventesInRange: Vente[];
  depensesInRange: Depense[];
  tresorerieInRange: Tresorerie[];
  /** Toutes les productions — pour les KPI fixes (stock ferme). */
  allProductions: Production[];
  /** Toutes les entrées de trésorerie — pour les KPI fixes (reste à verser). */
  allTresorerie: Tresorerie[];
  /** Tous les transferts (le stock magasin est cumulatif). */
  allTransferts: TransfertStock[];
  /** Toutes les ventes (idem — pour le cumul du stock magasin). */
  allVentes: Vente[];
  /** Toutes les dépenses — calculerBenefice filtre par plage en interne. */
  allDepenses: Depense[];
  /** Borne basse de la période calendrier (calculerCA / calculerBenefice). */
  rangeStart: Date;
  /** Borne haute de la période (stock magasin + CA / bénéfice). */
  rangeEnd: Date;
  /** Capacité d'un plateau — conversion alvéoles. */
  capacitePlateau: number;
  /** Configuration ferme — libellés catégories (kpiDepenses). */
  config: FarmConfig;
};

export function buildDashboardKpis(
  input: DashboardAggregateInput
): DashboardKpiSnapshot {
  const cap = input.capacitePlateau;
  const rangeStart = startOfDay(input.rangeStart);
  const rangeEnd = startOfDay(input.rangeEnd);

  const prodInRange = aggregateProductions(input.productionsInRange, cap);

  return {
    alveolesRamassees: kpiAlveolesRamassees(input.productionsInRange, cap),
    alveolesMisesEnVente: kpiAlveolesMisesEnVente(input.productionsInRange, cap),
    alveolesRestantes: kpiAlveolesFerme(
      input.allProductions,
      input.allTransferts,
      cap
    ),
    stockMagasin: kpiStockMagasin(input.allTransferts, input.allVentes, cap) * cap,
    chiffreAffaires: kpiCA(input.allVentes, rangeStart, rangeEnd, cap),
    totalDepenses: kpiDepenses(input.allDepenses, rangeStart, rangeEnd, input.config),
    profit: kpiProfit(input.allVentes, input.allDepenses, rangeStart, rangeEnd, cap),
    pertesTotales: kpiPertesTotales(
      input.allProductions,
      input.allVentes,
      rangeStart,
      rangeEnd,
      cap
    ),
    oeufsCassesFerme: prodInRange.oeufsCasses,
    montantRemis: kpiTresorerieVersePeriode(
      input.allTresorerie,
      rangeStart,
      rangeEnd
    ),
    montantEnAttente: kpiResteAVerser(
      input.allVentes,
      input.allDepenses,
      input.allTresorerie,
      cap,
      input.config
    ),
  };
}

/* ===========================================================
   Série temporelle pour le graphique
   =========================================================== */

export type ActivityMetricKey = "profit" | "ca" | "depenses" | "production";

export type ActivityPoint = {
  dateISO: string;
  profit: number;
  ca: number;
  depenses: number;
  production: number;
};

function dayKey(d: Date): string {
  return startOfDay(d).toISOString();
}

/**
 * Série journalière (1 point par jour) sur la période [start, end].
 * Renvoie au minimum un tableau vide — jamais null.
 */
export function buildActivityTimeline(
  start: Date,
  end: Date,
  productions: Production[],
  ventes: Vente[],
  depenses: Depense[],
  capacitePlateau: number,
  config: FarmConfig
): ActivityPoint[] {
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (e.getTime() < s.getTime()) return [];

  const points: ActivityPoint[] = [];
  let cur = s;
  while (cur.getTime() <= e.getTime()) {
    const dayStart = startOfDay(cur);
    const dayEnd = dayStart;
    const k = cur.toISOString();
    const dayProductions = productions.filter(
      (p) =>
        p.statut === "actif" &&
        dayKey(new Date(p.jourISO)) === dayKey(dayStart)
    );
    const ca = kpiCA(ventes, dayStart, dayEnd, capacitePlateau);
    const dep = kpiDepenses(depenses, dayStart, dayEnd, config);
    points.push({
      dateISO: k,
      ca,
      depenses: dep,
      profit: kpiProfit(ventes, depenses, dayStart, dayEnd, capacitePlateau),
      production: kpiAlveolesRamassees(dayProductions, capacitePlateau),
    });
    cur = addDays(cur, 1);
  }
  return points;
}

/* ===========================================================
   Helpers de période (notifications, rapports)
   =========================================================== */

export function lastNDays(end: Date, n: number): { start: Date; end: Date } {
  return { start: subDays(startOfDay(end), n - 1), end: startOfDay(end) };
}
