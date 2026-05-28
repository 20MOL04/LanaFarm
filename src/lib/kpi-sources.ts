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
import { eggsToTrays } from "./units";
import type {
  Production, Vente, Depense,
  Tresorerie, TransfertStock, FarmConfig
} from "@/types/domain";

/* ══════════════════════════════════════
   TYPE 1 — KPIs FIXES (cumulatif total)
   Jamais filtrés par période
   ══════════════════════════════════════ */

/** SOURCE UNIQUE — Alvéoles dispo à la ferme (stock instantané cumulatif) */
export function kpiAlveolesFerme(
  productions: Production[],
  transferts: TransfertStock[],
  cap: number
): number {
  const today = new Date();
  const oeufs = stockFermeDisponiblePourEnvoi(productions, transferts, today);
  return eggsToTrays(oeufs, cap);
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

/** SOURCE UNIQUE — Reste à verser (cumulatif) */
export function kpiResteAVerser(
  ventes: Vente[],
  tresorerie: Tresorerie[],
  cap: number
): number {
  const caTotal = calculerCA(
    ventes,
    new Date(0),
    new Date(),
    cap
  );
  const totalVerse = aggregateTresorerie(
    tresorerie
  ).totalDepose;
  return Math.max(0, caTotal - totalVerse);
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

/** SOURCE UNIQUE — Montant versé */
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

