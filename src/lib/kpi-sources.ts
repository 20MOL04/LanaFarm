/**
 * ╔════════════════════════════════════╗
 * ║   LANAFARM — SOURCE KPIs UNIQUE   ║
 * ║   NE PAS DUPLIQUER CES FONCTIONS  ║
 * ║   Toute modification → ICI SEUL   ║
 * ╚════════════════════════════════════╝
 *
 * RÈGLE ABSOLUE :
 * Chaque KPI a UNE seule source ici.
 * Tout composant importe depuis ce fichier.
 * Jamais calculé inline dans un composant.
 */

import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import {
  stockMagasinInstantane,
  calculerCA,
  calculerBenefice,
} from "./lanafarm-core";
import { aggregateProductions } from "./production-calc";
import { stockFermeDisponiblePourEnvoi } from "./transfers-calc";
import { aggregateExpenses } from "./expenses-calc";
import { aggregateTresorerie } from "./tresorerie-calc";
import { aggregateSales } from "./sales-calc";
import { startOfDay } from "date-fns";
import { eggsToTrays } from "./units";
import type {
  Production, Vente, Depense,
  Tresorerie, TransfertStock, FarmConfig
} from "@/types/domain";

/* ══════════════════════════════════════
   TYPE 1 — KPIs FIXES (cumulatif total)
   Jamais filtrés par période
   ══════════════════════════════════════ */

/** SOURCE UNIQUE — Stock ferme (alvéoles) à une date donnée. */
export function kpiAlveolesFermeAt(
  productions: Production[],
  transferts: TransfertStock[],
  cap: number,
  at: Date
): number {
  const oeufs = stockFermeDisponiblePourEnvoi(productions, transferts, at);
  return eggsToTrays(oeufs, cap);
}

/** SOURCE UNIQUE — Stock ferme instantané (aujourd'hui). */
export function kpiAlveolesFerme(
  productions: Production[],
  transferts: TransfertStock[],
  cap: number
): number {
  return kpiAlveolesFermeAt(productions, transferts, cap, new Date());
}

/** SOURCE UNIQUE — Stock magasin (cumulatif) */
export function kpiStockMagasin(
  transferts: TransfertStock[],
  ventes: Vente[],
  cap: number
): number {
  const today = new Date();
  const oeufs = stockMagasinInstantane(transferts, ventes, today);
  return eggsToTrays(oeufs, cap);
}

/** Borne basse historique pour les KPI cumulatifs (depuis l'origine). */
export const KPI_EPOCH = new Date(0);

/** SOURCE UNIQUE — Reste à verser (cumul global, non filtré par période). */
export function kpiResteAVerser(
  ventes: Vente[],
  depenses: Depense[],
  tresorerie: Tresorerie[],
  cap: number,
  config: FarmConfig
): number {
  const now = new Date();
  const caTotal = kpiCA(ventes, KPI_EPOCH, now, cap);
  const depTotal = kpiDepenses(depenses, KPI_EPOCH, now, config);
  const verseTotal = kpiMontantVerse(tresorerie);
  return caTotal - depTotal - verseTotal;
}

/* ══════════════════════════════════════
   TYPE 2 — KPIs FILTRÉS PAR PÉRIODE
   ══════════════════════════════════════ */

/** SOURCE UNIQUE — Chiffre d'affaires */
export function kpiCA(
  ventes: Vente[],
  from: Date,
  to: Date,
  cap: number
): number {
  return calculerCA(ventes, from, to, cap);
}

/** SOURCE UNIQUE — Dépenses totales */
export function kpiDepenses(
  depenses: Depense[],
  from: Date,
  to: Date,
  config: FarmConfig
): number {
  return aggregateExpenses(
    depenses.filter(d =>
      d.statut === "actif" &&
      new Date(d.jourISO) >= from &&
      new Date(d.jourISO) <= to
    ),
    config
  ).total;
}

/** SOURCE UNIQUE — Profit */
export function kpiProfit(
  ventes: Vente[],
  depenses: Depense[],
  from: Date,
  to: Date,
  cap: number
): number {
  return calculerBenefice(ventes, depenses, from, to, cap);
}

/** SOURCE UNIQUE — Alvéoles ramassées */
export function kpiAlveolesRamassees(
  productions: Production[],
  cap: number
): number {
  return aggregateProductions(productions, cap).alveolesRamassees;
}

/** SOURCE UNIQUE — Alvéoles mises en vente */
export function kpiAlveolesMisesEnVente(
  productions: Production[],
  cap: number
): number {
  return aggregateProductions(productions, cap).alveolesMisesEnVente;
}

/**
 * SOURCE UNIQUE — Σ alvéoles restantes par jour sur la période
 * (ramassées − mises en vente, par saisie). ≠ stock ferme instantané.
 */
export function kpiAlveolesRestantesPeriode(
  productions: Production[],
  from: Date,
  to: Date,
  cap: number
): number {
  const rangeStart = startOfDay(from);
  const rangeEnd = startOfDay(to);
  const inRange = productions.filter(
    (p) =>
      p.statut === "actif" &&
      startOfDay(new Date(p.jourISO)).getTime() >= rangeStart.getTime() &&
      startOfDay(new Date(p.jourISO)).getTime() <= rangeEnd.getTime()
  );
  return aggregateProductions(inRange, cap).alveolesRestantes;
}

/** SOURCE UNIQUE — Marge brute (CA − dépenses) / CA en % entier ; null si CA = 0. */
export function kpiMargeBrutePct(
  ventes: Vente[],
  depenses: Depense[],
  from: Date,
  to: Date,
  cap: number,
  config: FarmConfig
): number | null {
  const ca = kpiCA(ventes, from, to, cap);
  if (ca <= 0) return null;
  const dep = kpiDepenses(depenses, from, to, config);
  return Math.round(((ca - dep) / ca) * 100);
}

/**
 * SOURCE UNIQUE — Prix moyen par alvéole vendue sur la période (GNF / alv.).
 */
export function kpiPrixMoyenVente(
  ventes: Vente[],
  from: Date,
  to: Date,
  cap: number
): number {
  const rangeStart = startOfDay(from);
  const rangeEnd = startOfDay(to);
  const inRange = ventes.filter(
    (v) =>
      v.statut === "actif" &&
      startOfDay(new Date(v.jourISO)).getTime() >= rangeStart.getTime() &&
      startOfDay(new Date(v.jourISO)).getTime() <= rangeEnd.getTime()
  );
  const sales = aggregateSales(inRange, [], cap);
  if (sales.alveolesVendues <= 0) return 0;
  return Math.round(kpiCA(ventes, from, to, cap) / sales.alveolesVendues);
}

/**
 * SOURCE UNIQUE — Σ montantRecu trésorerie active sur la période.
 */
export function kpiTresorerieRecuPeriode(
  tresorerie: Tresorerie[],
  from: Date,
  to: Date
): number {
  const rangeStart = startOfDay(from);
  const rangeEnd = startOfDay(to);
  return tresorerie
    .filter(
      (t) =>
        t.statut === "actif" &&
        startOfDay(new Date(t.jourISO)).getTime() >= rangeStart.getTime() &&
        startOfDay(new Date(t.jourISO)).getTime() <= rangeEnd.getTime()
    )
    .reduce((sum, t) => sum + t.montantRecu, 0);
}

/**
 * SOURCE UNIQUE — Σ depose (versé) trésorerie active sur la période.
 */
export function kpiTresorerieVersePeriode(
  tresorerie: Tresorerie[],
  from: Date,
  to: Date
): number {
  const rangeStart = startOfDay(from);
  const rangeEnd = startOfDay(to);
  return tresorerie
    .filter(
      (t) =>
        t.statut === "actif" &&
        startOfDay(new Date(t.jourISO)).getTime() >= rangeStart.getTime() &&
        startOfDay(new Date(t.jourISO)).getTime() <= rangeEnd.getTime()
    )
    .reduce((sum, t) => sum + t.depose, 0);
}

/** SOURCE UNIQUE — Montant versé (cumul, toutes périodes). */
export function kpiMontantVerse(
  tresorerie: Tresorerie[]
): number {
  return aggregateTresorerie(tresorerie).totalDepose;
}

/** SOURCE UNIQUE — Pertes totales (œufs) */
export function kpiPertesTotales(
  productions: Production[],
  ventes: Vente[],
  from: Date,
  to: Date,
  cap: number
): number {
  const prodRange = productions.filter(p =>
    new Date(p.jourISO) >= from &&
    new Date(p.jourISO) <= to
  );
  const ventesRange = ventes.filter(v =>
    v.statut === "actif" &&
    new Date(v.jourISO) >= from &&
    new Date(v.jourISO) <= to
  );
  const prod = aggregateProductions(prodRange, cap);
  const sales = aggregateSales(
    ventesRange,
    prodRange,
    cap
  );
  return prod.oeufsCasses + (SHOW_VENTE_CASSES ? sales.casses : 0);
}

