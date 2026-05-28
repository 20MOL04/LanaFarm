/**
 * Logique de calcul du module Transferts de stock (Ferme → Magasin).
 *
 * Architecture :
 *   - Un transfert est créé automatiquement par toute saisie Production
 *     avec envoyesVente > 0 (cf. farm-store, reducer `production/add`).
 *   - En V1 mono-site, autoConfirm = true → statut "recu" immédiat,
 *     jourReceptionISO = jourEnvoiISO, ecart = 0.
 *   - En V2 multi-site, la réception sera manuelle (transfert/confirm).
 */

import { startOfDay } from "date-fns";

import { stockFermeInstantane, stockMagasinInstantane } from "@/lib/lanafarm-core";
import type { Production, TransfertStatut, TransfertStock, Vente } from "@/types/domain";

function isOnOrBeforeTransferDay(iso: string, upToDate: Date): boolean {
  return startOfDay(new Date(iso)).getTime() <= startOfDay(upToDate).getTime();
}

/**
 * Stock ferme disponible pour un envoi manuel : stock production
 * moins les transferts manuels déjà reçus (non comptés dans envoyesVente).
 * Source unique — RÈGLE S2 du skill LanaFarm.
 */
export function stockFermeDisponiblePourEnvoi(
  productions: Production[],
  transferts: TransfertStock[],
  upToDate: Date
): number {
  const base = stockFermeInstantane(productions, upToDate);
  let manualOut = 0;
  for (const t of transferts) {
    if (t.productionId) continue;
    if (t.statut !== "recu") continue;
    const jour = t.jourReceptionISO ?? t.jourEnvoiISO;
    if (!isOnOrBeforeTransferDay(jour, upToDate)) continue;
    manualOut += t.quantiteRecue ?? t.quantiteEnvoyee;
  }
  return Math.max(0, base - manualOut);
}

/* ===========================================================
   Agrégats — utilisables pour un futur panneau "Réceptions"
   =========================================================== */

export type TransfersTotals = {
  total: number;
  parStatut: Record<TransfertStatut, number>;
  /** Σ quantitéEnvoyée — tous statuts confondus (hors contesté). */
  totalEnvoye: number;
  /** Σ quantitéReçue — statut "recu" uniquement. */
  totalRecu: number;
  /** Σ |ecart| — diagnostic. */
  totalEcart: number;
};

export function aggregateTransfers(transferts: TransfertStock[]): TransfersTotals {
  const totals: TransfersTotals = {
    total: 0,
    parStatut: { en_attente: 0, recu: 0, conteste: 0 },
    totalEnvoye: 0,
    totalRecu: 0,
    totalEcart: 0,
  };
  for (const t of transferts) {
    totals.total += 1;
    totals.parStatut[t.statut] += 1;
    if (t.statut !== "conteste") totals.totalEnvoye += t.quantiteEnvoyee;
    if (t.statut === "recu") {
      totals.totalRecu += t.quantiteRecue ?? t.quantiteEnvoyee;
    }
    if (typeof t.ecart === "number") totals.totalEcart += Math.abs(t.ecart);
  }
  return totals;
}

/* ===========================================================
   Stock magasin CUMULATIF (Phase C)
   -----------------------------------------------------------
   Formule canonique :
     Stock Magasin(J) =
         Σ Transfert.quantiteRecue (statut "recu", jourReception ≤ J)
       − Σ Vente.vendus            (actives, jour ≤ J)
       − Σ Vente.cassesVente       (actives, jour ≤ J)

   L'invendu se reporte naturellement d'un jour à l'autre.
   Indépendant de la plage globale du calendrier — balaye TOUS
   les transferts/ventes depuis l'origine pour éviter les faux
   négatifs au début d'une période visible.
   =========================================================== */

/**
 * Stock magasin disponible à un instant donné MOINS la contribution
 * d'une ligne vente spécifique (utilisé pour les validations en édition).
 * Si `excludeSaleId` est fourni, la vente correspondante est ignorée.
 */
export function stockMagasinAvailableForSale(
  dateMax: Date,
  transferts: TransfertStock[],
  ventes: Vente[],
  excludeSaleId?: string
): number {
  const filtered = excludeSaleId
    ? ventes.filter((v) => v.id !== excludeSaleId)
    : ventes;
  return stockMagasinInstantane(transferts, filtered, dateMax);
}
