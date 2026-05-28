/**
 * Logique de calcul du module Ventes.
 * Source unique de vérité — toute UI ou agrégation passe par ces helpers.
 *
 * Règles métier :
 *   - Reçu Ferme(jour)  = Σ transferts reçus du jour (lanafarm-core.recuFermeJour)
 *   - Reste Vente(jour) = Reçu Ferme(jour) − Σ vendus(jour) − Σ cassesVente(jour)
 *   - Montant(ligne)    = alvéoles vendues × prix casier
 *   - CA cumulé sur période          = Σ calcSaleLineMontant(ligne actif)
 *   - Stock magasin instantané       = lanafarm-core / transfers-calc (pas ici)
 */

import { startOfDay } from "date-fns";

import { formatNumber } from "@/lib/format";
import { recuFermeJour, stockMagasinInstantane } from "@/lib/lanafarm-core";
import { stockMagasinAvailableForSale } from "@/lib/transfers-calc";
import { eggsToTrays, traysToEggs, EGGS_PER_TRAY_DEFAULT } from "@/lib/units";
import type { Production, TransfertStock, Vente } from "@/types/domain";

/** Montant d'une ligne : alvéoles × prix casier (persistance `vendus` en œufs). */
export function calcSaleLineMontant(
  vendusEggs: number,
  prixCasier: number,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): number {
  return eggsToTrays(vendusEggs, capacitePlateau) * prixCasier;
}
function dayKey(iso: string): string {
  return startOfDay(new Date(iso)).toISOString();
}

/**
 * Indexe les ventes ACTIVES par jour (vendus / cassés / montant).
 */
export type DailySalesSummary = {
  vendus: number;
  casses: number;
  montant: number;
};

export function indexSalesByDay(
  ventes: Vente[],
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): Map<string, DailySalesSummary> {
  const map = new Map<string, DailySalesSummary>();
  for (const v of ventes) {
    if (v.statut !== "actif") continue;
    const k = dayKey(v.jourISO);
    const cur = map.get(k) ?? { vendus: 0, casses: 0, montant: 0 };
    cur.vendus += v.vendus;
    cur.casses += v.cassesVente;
    cur.montant += calcSaleLineMontant(v.vendus, v.prix, capacitePlateau);
    map.set(k, cur);
  }
  return map;
}

/* ===========================================================
   Snapshots historiques d'une saisie Vente
   -----------------------------------------------------------
   Calculés au moment de la création / mise à jour pour garder
   une trace cohérente dans le stockage (Vente.recuFerme,
   Vente.resteVente, Vente.montant — ces deux premiers étant
   `@deprecated` mais conservés pour la rétro-compatibilité).

   computeVenteSnapshot conserve production.envoyesVente (Vague B).
   Affichage tableau : `buildSaleRowViews()` + lanafarm-core (transferts).
   =========================================================== */

export type VenteSnapshot = {
  recuFerme: number;
  resteVente: number;
  montant: number;
};

export function computeVenteSnapshot(
  draft: { jourISO: string; vendus: number; cassesVente: number; prix: number },
  productions: Production[],
  autresVentesDuJour: Vente[] = [],
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): VenteSnapshot {
  const k = dayKey(draft.jourISO);

  let recuFerme = 0;
  for (const p of productions) {
    if (p.statut !== "actif") continue;
    if (dayKey(p.jourISO) === k) recuFerme += p.envoyesVente;
  }

  let consommeAutres = 0;
  for (const v of autresVentesDuJour) {
    if (v.statut !== "actif") continue;
    if (dayKey(v.jourISO) === k) consommeAutres += v.vendus + v.cassesVente;
  }

  const resteVente = recuFerme - consommeAutres - draft.vendus - draft.cassesVente;
  const montant = calcSaleLineMontant(draft.vendus, draft.prix, capacitePlateau);

  return { recuFerme, resteVente, montant };
}

/* ===========================================================
   Vues par ligne (utilisées par le tableau Ventes)
   =========================================================== */

export type SaleRowView = {
  vente: Vente;
  /** Reçu ferme du JOUR en œufs (legacy — tableau UI utilise eggsToTrays). */
  recuFermeJour: number;
  /** Reçu du jour en alvéoles — source transferts reçus (lanafarm-core). */
  recuJour: number;
  /** Stock magasin cumulatif en alvéoles — indépendant de recuJour (D3). */
  stockDispo: number;
  /** Reste vente du JOUR — après TOUTES les lignes actives du jour. */
  resteVenteJour: number;
  /** Montant propre à la ligne (alvéoles × prix casier). */
  montant: number;
  /**
   * Phase C : stock magasin cumulé en fin de journée de cette ligne.
   * Tient compte de TOUS les transferts reçus et de TOUTES les ventes
   * actives jusqu'à cette date (l'invendu se reporte naturellement).
   * Optionnel : non rempli si `transferts` n'est pas fourni (rétrocompat).
   */
  stockMagasinFinJour?: number;
};

export function buildSaleRowViews(
  ventes: Vente[],
  productions: Production[],
  transferts?: TransfertStock[],
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): SaleRowView[] {
  void productions;
  const salesByDay = indexSalesByDay(ventes, capacitePlateau);

  return ventes.map((v) => {
    const k = dayKey(v.jourISO);
    const date = new Date(v.jourISO);
    const day = salesByDay.get(k) ?? { vendus: 0, casses: 0, montant: 0 };

    const recuOeufs = transferts ? recuFermeJour(transferts, date) : 0;
    const recuAlv = eggsToTrays(recuOeufs, capacitePlateau);
    const stockOeufs = transferts
      ? stockMagasinInstantane(transferts, ventes, date)
      : 0;
    const stockAlv = eggsToTrays(stockOeufs, capacitePlateau);

    return {
      vente: v,
      recuFermeJour: recuOeufs,
      recuJour: recuAlv,
      stockDispo: stockAlv,
      resteVenteJour: recuOeufs - day.vendus - day.casses,
      montant: calcSaleLineMontant(v.vendus, v.prix, capacitePlateau),
      stockMagasinFinJour: transferts
        ? stockMagasinInstantane(transferts, ventes, date)
        : undefined,
    };
  });
}

/* ===========================================================
   Agrégats — KPI du module Ventes
   =========================================================== */

export type SalesTotals = {
  /** Œufs vendus (persistance interne). */
  vendus: number;
  /** Σ alvéoles vendues — affichage opérateur. */
  alveolesVendues: number;
  /** Œufs cassés côté vente sur la période. */
  casses: number;
  /** CA période — Σ calcSaleLineMontant par ligne active. */
  montant: number;
  saisies: number;
};

export function aggregateSales(
  ventesInPeriod: Vente[],
  _productionsInPeriod: Production[],
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): SalesTotals {
  let vendus = 0;
  let casses = 0;
  let montant = 0;
  let saisies = 0;
  for (const v of ventesInPeriod) {
    if (v.statut !== "actif") continue;
    vendus += v.vendus;
    casses += v.cassesVente;
    montant += calcSaleLineMontant(v.vendus, v.prix, capacitePlateau);
    saisies += 1;
  }

  return {
    vendus,
    alveolesVendues: eggsToTrays(vendus, capacitePlateau),
    casses,
    montant,
    saisies,
  };
}

/* ===========================================================
   Validation du formulaire d'ajout
   =========================================================== */

export type SaleFormErrors = Partial<{
  jourISO: string;
  vendus: string;
  cassesVente: string;
  prix: string;
}>;

export type SaleDraft = {
  jourISO: string;
  vendus: number;
  cassesVente: number;
  prix: number;
  client?: string;
};

/* ===========================================================
   Phase C — Validation basée sur le stock magasin CUMULATIF
   =========================================================== */

export type CumulativeStockContext = {
  /** Tous les transferts (statut "recu" inclus). */
  transferts: TransfertStock[];
  /** Toutes les ventes — la ligne en cours sera exclue si `excludeSaleId`. */
  toutesVentes: Vente[];
  /** ID de la ligne en cours d'édition (exclue du cumul des "autres ventes"). */
  excludeSaleId?: string;
};

export type CumulativeValidationResult = {
  errors: SaleFormErrors;
  /** Stock magasin disponible avant la ligne en cours (info UI). */
  stockDisponible: number;
};

/**
 * Valide une vente contre le stock magasin CUMULATIF.
 *
 *   stockDisponible(jour) = stockMagasinInstantane(jour) − (déjà décompté par d'autres ventes du jour)
 *
 * Refuse si `draft.vendus + draft.cassesVente > stockDisponible`.
 * Ce stock se reporte naturellement d'un jour à l'autre — fini les
 * "invendus du soir perdus dans le néant".
 */
export function validateSaleDraftWithCumulativeStock(
  draft: SaleDraft,
  context: CumulativeStockContext
): CumulativeValidationResult {
  const errors: SaleFormErrors = {};

  if (!draft.jourISO) errors.jourISO = "Date requise.";
  if (!Number.isFinite(draft.vendus) || draft.vendus < 0) errors.vendus = "Quantité invalide.";
  if (!Number.isFinite(draft.cassesVente) || draft.cassesVente < 0) errors.cassesVente = "Quantité invalide.";
  if (!Number.isFinite(draft.prix) || draft.prix <= 0) errors.prix = "Prix invalide.";

  // Stock magasin disponible AVANT la ligne en cours :
  //   - tient compte de tous les transferts reçus
  //   - tient compte de toutes les autres ventes (passées ET du jour)
  //   - exclut la ligne en cours d'édition si excludeSaleId fourni
  const dateRef = draft.jourISO ? new Date(draft.jourISO) : new Date();
  const stockDisponible = stockMagasinAvailableForSale(
    dateRef,
    context.transferts,
    context.toutesVentes,
    context.excludeSaleId
  );

  if (Object.keys(errors).length === 0) {
    const sortie = draft.vendus + draft.cassesVente;
    if (sortie > stockDisponible) {
      errors.vendus = `Stock magasin insuffisant : ${stockDisponible} œufs disponibles, ${sortie} demandés (vendus + cassés).`;
    }
  }

  return { errors, stockDisponible };
}

/* ===========================================================
   Saisie journalière multi-lignes (UI alvéoles)
   =========================================================== */

export type SaleLineUiDraft = {
  alveoles: number;
  prix: number;
  client?: string;
};

export type SaleDayUiDraft = {
  jourISO: string;
  lignes: SaleLineUiDraft[];
  oeufsCasses: number;
  /** Client par défaut pour les lignes sans client propre. */
  client?: string;
};

export type SaleDayFormErrors = {
  jourISO?: string;
  oeufsCasses?: string;
  form?: string;
  lignes?: Partial<Record<number, { alveoles?: string; prix?: string }>>;
};

export type SaleDayValidation = {
  errors: SaleDayFormErrors;
  stockDisponible: number;
  stockApres: number;
  montantTotal: number;
  alveolesTotales: number;
};

export function saleDayUiToStorageDrafts(
  ui: SaleDayUiDraft,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): SaleDraft[] {
  const actives = ui.lignes.filter((l) => l.alveoles > 0);
  return actives.map((ligne, index) => ({
    jourISO: ui.jourISO,
    vendus: traysToEggs(Math.max(0, Math.floor(ligne.alveoles)), capacitePlateau),
    prix: ligne.prix,
    cassesVente: index === 0 ? Math.max(0, Math.floor(ui.oeufsCasses)) : 0,
    client: ligne.client?.trim() || ui.client?.trim() || undefined,
  }));
}

export function validateSaleDayUiDraft(
  ui: SaleDayUiDraft,
  context: CumulativeStockContext,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): SaleDayValidation {
  const errors: SaleDayFormErrors = {};
  const ligneErrors: NonNullable<SaleDayFormErrors["lignes"]> = {};

  if (!ui.jourISO) errors.jourISO = "Date requise.";
  if (!Number.isFinite(ui.oeufsCasses) || ui.oeufsCasses < 0) {
    errors.oeufsCasses = "Quantité invalide.";
  }

  const actives = ui.lignes
    .map((l, index) => ({ ...l, index }))
    .filter((l) => l.alveoles > 0 || l.prix > 0);

  if (actives.length === 0) {
    errors.form = "Ajoute au moins une ligne de vente avec des alvéoles.";
  }

  for (const ligne of actives) {
    const rowErr: { alveoles?: string; prix?: string } = {};
    if (
      !Number.isFinite(ligne.alveoles) ||
      ligne.alveoles < 0 ||
      !Number.isInteger(ligne.alveoles)
    ) {
      rowErr.alveoles = "Nombre entier d'alvéoles uniquement.";
    }
    if (ligne.alveoles > 0 && (!Number.isFinite(ligne.prix) || ligne.prix <= 0)) {
      rowErr.prix = "Prix casier requis.";
    }
    if (Object.keys(rowErr).length > 0) ligneErrors[ligne.index] = rowErr;
  }

  if (Object.keys(ligneErrors).length > 0) errors.lignes = ligneErrors;

  let alveolesTotales = 0;
  let montantTotal = 0;
  for (const l of ui.lignes) {
    if (l.alveoles <= 0) continue;
    alveolesTotales += l.alveoles;
    montantTotal += l.alveoles * l.prix;
  }

  const sortieOeufs =
    traysToEggs(alveolesTotales, capacitePlateau) +
    Math.max(0, Math.floor(ui.oeufsCasses));

  const dateRef = ui.jourISO ? new Date(ui.jourISO) : new Date();
  const stockDisponible = stockMagasinAvailableForSale(
    dateRef,
    context.transferts,
    context.toutesVentes,
    context.excludeSaleId
  );
  const stockApres = stockDisponible - sortieOeufs;

  if (
    Object.keys(errors).length === 0 &&
    sortieOeufs > stockDisponible
  ) {
    const dispoAlv = eggsToTrays(stockDisponible, capacitePlateau);
    errors.form = `Stock insuffisant : ${formatStockAlveoles(dispoAlv)} disponibles, ${alveolesTotales} alvéoles + ${ui.oeufsCasses} œufs cassés demandés.`;
  }

  return {
    errors,
    stockDisponible,
    stockApres,
    montantTotal,
    alveolesTotales,
  };
}

function formatStockAlveoles(trays: number): string {
  return formatNumber(trays);
}
