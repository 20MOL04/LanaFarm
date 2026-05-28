/**
 * LanaFarm — source de vérité unique pour les calculs métier critiques.
 * Tous les modules (ventes, dashboard, rapports) doivent importer depuis ici.
 */

import { startOfDay } from "date-fns";

import { eggsToTrays } from "@/lib/units";
import type {
  Depense,
  ISODate,
  Production,
  TransfertStock,
  Vente,
} from "@/types/domain";

/* ===========================================================
   Dates — normalisation unique
   =========================================================== */

function normalizeDate(date: Date): Date {
  return startOfDay(date);
}

function dateFromIso(iso: ISODate): Date {
  return startOfDay(new Date(iso));
}

function isOnOrBeforeDay(iso: ISODate, upToDate: Date): boolean {
  return dateFromIso(iso).getTime() <= normalizeDate(upToDate).getTime();
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return normalizeDate(a).getTime() === normalizeDate(b).getTime();
}

function isInInclusivePeriod(iso: ISODate, dateDebut: Date, dateFin: Date): boolean {
  const t = dateFromIso(iso).getTime();
  return t >= normalizeDate(dateDebut).getTime() && t <= normalizeDate(dateFin).getTime();
}

/* ===========================================================
   Mapping domaine → vocabulaire métier (D2)
   =========================================================== */

/** Œufs collectés — `Production.production`. */
function eggsCollected(p: Production): number {
  return p.production;
}

/** Œufs transférés vers le magasin — `Production.envoyesVente`. */
function eggsTransferred(p: Production): number {
  return p.envoyesVente;
}

function quantiteOeufsTransfertRecu(t: TransfertStock): number {
  return t.quantiteRecue ?? t.quantiteEnvoyee;
}

function dateTransfertRecu(t: TransfertStock): Date {
  return dateFromIso(t.jourReceptionISO ?? t.jourEnvoiISO);
}

/* ===========================================================
   Fonctions officielles (6)
   =========================================================== */

/** Stock physique disponible à la ferme à une date (œufs). Cassés exclus (D2). */
export function stockFermeInstantane(
  productions: Production[],
  upToDate: Date
): number {
  let stock = 0;
  for (const p of productions) {
    if (p.statut !== "actif") continue;
    if (!isOnOrBeforeDay(p.jourISO, upToDate)) continue;
    stock += eggsCollected(p) - eggsTransferred(p);
  }
  return Math.max(0, stock);
}

/** Stock magasin cumulatif à une date (œufs). Seule base de validation des ventes (D3). */
export function stockMagasinInstantane(
  transferts: TransfertStock[],
  ventes: Vente[],
  upToDate: Date
): number;
export function stockMagasinInstantane(
  transferts: TransfertStock[],
  ventes: Vente[],
  upToDate: Date
): number {
  let stock = 0;

  for (const t of transferts) {
    if (t.statut !== "recu") continue;
    if (!isOnOrBeforeDay(t.jourReceptionISO ?? t.jourEnvoiISO, upToDate)) continue;
    stock += quantiteOeufsTransfertRecu(t);
  }

  for (const v of ventes) {
    if (v.statut !== "actif") continue;
    if (!isOnOrBeforeDay(v.jourISO, upToDate)) continue;
    stock -= v.vendus + v.cassesVente;
  }

  return Math.max(0, stock);
}

/** Reçu ferme d'un jour (œufs) — affichage uniquement, source = transferts reçus. */
export function recuFermeJour(transferts: TransfertStock[], date: Date): number {
  let total = 0;
  for (const t of transferts) {
    if (t.statut !== "recu") continue;
    if (!isSameCalendarDay(dateTransfertRecu(t), date)) continue;
    total += quantiteOeufsTransfertRecu(t);
  }
  return total;
}

/** Chiffre d'affaires sur une période (GNF) — alvéoles × prix par ligne (D5). */
export function calculerCA(
  ventes: Vente[],
  dateDebut: Date,
  dateFin: Date,
  capacitePlateau?: number
): number {
  let ca = 0;
  for (const v of ventes) {
    if (v.statut !== "actif") continue;
    if (!isInInclusivePeriod(v.jourISO, dateDebut, dateFin)) continue;
    ca += eggsToTrays(v.vendus, capacitePlateau) * v.prix;
  }
  return ca;
}

/** Bénéfice net sur une période (GNF) — peut être négatif. */
export function calculerBenefice(
  ventes: Vente[],
  depenses: Depense[],
  dateDebut: Date,
  dateFin: Date,
  capacitePlateau?: number
): number {
  const ca = calculerCA(ventes, dateDebut, dateFin, capacitePlateau);
  let totalDepenses = 0;
  for (const d of depenses) {
    if (d.statut !== "actif") continue;
    if (!isInInclusivePeriod(d.jourISO, dateDebut, dateFin)) continue;
    totalDepenses += d.montant;
  }
  return ca - totalDepenses;
}

/*
 * Tests mentaux (validation manuelle) :
 *
 * stockFermeInstantane — D2 :
 *   100 ramassées, 30 envoyées → 70 œufs (casses n'affectent pas le stock)
 *
 * stockMagasinInstantane :
 *   60 reçus - 40 vendus - 5 cassés vente = 15 → max(0,15) = 15
 *
 * calculerCA — D5 :
 *   10 alv. (300 œufs) × 38_000 = 380_000 GNF
 *   3 lignes : 10×38k + 22×36.5k + 5×40k = 1_383_000 GNF
 *
 * recuFermeJour :
 *   2 transferts recu même jour : 30 + 20 = 50 œufs
 */
