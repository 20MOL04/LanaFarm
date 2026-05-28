/**
 * Logique de calcul du module Production — contrat métier stabilisé.
 *
 * Sémantique officielle (unité primaire : alvéole) :
 *   • Alvéoles ramassées   = volume collecté / produit (flux période)
 *   • Alvéoles mises en vente = volume transféré vers les ventes (flux)
 *   • Alvéoles restantes   = ramassées − mises en vente (par jour, Σ sur période)
 *   • Œufs cassés          = pertes réelles en œufs (hors équation alvéoles)
 *
 * Persistance domaine : champs `production`, `envoyesVente`, `casses` en œufs.
 * Conversion via {@link lib/units.ts} uniquement.
 */

import { formatNumber } from "@/lib/format";
import type { Production } from "@/types/domain";
import {
  EGGS_PER_TRAY_DEFAULT,
  eggsToTrays,
  traysToEggs,
} from "@/lib/units";

/* ===========================================================
   Calculs journaliers
   =========================================================== */

/** Alvéoles restantes du jour = ramassées − mises en vente (sans retrancher les cassés). */
export function calcAlveolesRestantesJour(
  p: Pick<Production, "production" | "envoyesVente">,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): number {
  const resteOeufs = p.production - p.envoyesVente;
  return eggsToTrays(resteOeufs, capacitePlateau);
}

/* ===========================================================
   Agrégats période
   =========================================================== */

export type ProductionTotals = {
  /** Σ alvéoles ramassées — flux période. */
  alveolesRamassees: number;
  /** Σ alvéoles mises en vente — flux période. */
  alveolesMisesEnVente: number;
  /** Σ alvéoles restantes (par jour). */
  alveolesRestantes: number;
  /** Σ œufs cassés ferme — pertes période. */
  oeufsCasses: number;
  saisies: number;
  /** Œufs bruts — compat transferts / ventes. */
  productionEggs: number;
  envoyesVenteEggs: number;
};

export function aggregateProductions(
  entries: Production[],
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): ProductionTotals {
  return entries.reduce<ProductionTotals>(
    (acc, p) => {
      if (p.statut !== "actif") return acc;
      acc.alveolesRamassees += eggsToTrays(p.production, capacitePlateau);
      acc.alveolesMisesEnVente += eggsToTrays(p.envoyesVente, capacitePlateau);
      acc.alveolesRestantes += calcAlveolesRestantesJour(p, capacitePlateau);
      acc.oeufsCasses += p.casses;
      acc.productionEggs += p.production;
      acc.envoyesVenteEggs += p.envoyesVente;
      acc.saisies += 1;
      return acc;
    },
    {
      alveolesRamassees: 0,
      alveolesMisesEnVente: 0,
      alveolesRestantes: 0,
      oeufsCasses: 0,
      saisies: 0,
      productionEggs: 0,
      envoyesVenteEggs: 0,
    }
  );
}

/* ===========================================================
   Saisie UI (alvéoles) ↔ persistance (œufs)
   =========================================================== */

/** Brouillon formulaire — unités opérateur. */
export type ProductionUiDraft = {
  jourISO: string;
  alveolesRamassees: number;
  alveolesMisesEnVente: number;
  oeufsCasses: number;
  notes?: string;
};

/** Brouillon persistance — œufs (store). */
export type ProductionDraft = {
  jourISO: string;
  production: number;
  casses: number;
  envoyesVente: number;
  notes?: string;
};

export type ProductionFormErrors = Partial<{
  jourISO: string;
  alveolesRamassees: string;
  alveolesMisesEnVente: string;
  oeufsCasses: string;
}>;

export function productionUiToStorageDraft(
  ui: ProductionUiDraft,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): ProductionDraft {
  const ramasseesAlv = Math.max(0, Math.floor(ui.alveolesRamassees));
  const misesAlv = Math.max(0, Math.floor(ui.alveolesMisesEnVente));
  return {
    jourISO: ui.jourISO,
    production: traysToEggs(ramasseesAlv, capacitePlateau),
    casses: Math.max(0, Math.floor(ui.oeufsCasses)),
    envoyesVente: traysToEggs(misesAlv, capacitePlateau),
    notes: ui.notes,
  };
}

export function validateProductionUiDraft(
  draft: ProductionUiDraft,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): ProductionFormErrors {
  const errors: ProductionFormErrors = {};

  if (!draft.jourISO) {
    errors.jourISO = "Date requise.";
  }
  if (
    !Number.isFinite(draft.alveolesRamassees) ||
    draft.alveolesRamassees < 0 ||
    !Number.isInteger(draft.alveolesRamassees)
  ) {
    errors.alveolesRamassees = "Nombre entier d'alvéoles uniquement.";
  }
  if (
    !Number.isFinite(draft.alveolesMisesEnVente) ||
    draft.alveolesMisesEnVente < 0 ||
    !Number.isInteger(draft.alveolesMisesEnVente)
  ) {
    errors.alveolesMisesEnVente = "Nombre entier d'alvéoles uniquement.";
  }
  if (!Number.isFinite(draft.oeufsCasses) || draft.oeufsCasses < 0) {
    errors.oeufsCasses = "Quantité invalide.";
  }

  if (Object.keys(errors).length === 0) {
    if (draft.alveolesMisesEnVente > draft.alveolesRamassees) {
      errors.alveolesMisesEnVente =
        "Les alvéoles mises en vente ne peuvent pas dépasser les alvéoles ramassées.";
    }
    const maxOeufs = draft.alveolesRamassees * capacitePlateau;
    if (draft.oeufsCasses > maxOeufs) {
      errors.oeufsCasses = `Cassés : maximum ${formatNumber(maxOeufs)} œufs pour ce volume ramassé.`;
    }
  }

  return errors;
}
