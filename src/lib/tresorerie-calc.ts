/**
 * Logique de calcul du module Trésorerie.
 * Source unique de vérité — toute UI, KPI, ou agrégation passe par ces helpers.
 *
 * Règles métier :
 *   - Reste(ligne)            = montantRecu − depose (versé)
 *   - Total Reçu (période)    = Σ montantRecu (actifs)
 *   - Total Versé (période)  = Σ depose      (actifs)
 *   - Reste à verser          = Total Reçu − Total Versé = Σ Reste
 *   - Méthode principale      = méthode au cumul reçu le plus élevé
 */

import { resolveMethodeLabel } from "@/lib/config-defaults";
import { formatGNF } from "@/lib/format";
import type { FarmConfig, Tresorerie } from "@/types/domain";

/** Reste à verser pour une ligne. */
export function calcReste(d: Pick<Tresorerie, "montantRecu" | "depose">): number {
  return d.montantRecu - d.depose;
}

/* ===========================================================
   Agrégats
   =========================================================== */

export type TresorerieTotals = {
  totalRecu: number;
  /** Montant versé sur la période. */
  totalDepose: number;
  /** Reste à verser sur la période. */
  enAttente: number;
  saisies: number;
  topMethode:
    | {
        id: string;
        label: string;
        montant: number;
        part: number;
      }
    | null;
  parMethode: {
    id: string;
    label: string;
    montant: number;
    part: number;
  }[];
};

export function aggregateTresorerie(
  lignes: Tresorerie[],
  config?: FarmConfig
): TresorerieTotals {
  let totalRecu = 0;
  let totalDepose = 0;
  let saisies = 0;
  const perMethode = new Map<string, number>();

  for (const d of lignes) {
    if (d.statut !== "actif") continue;
    totalRecu += d.montantRecu;
    totalDepose += d.depose;
    saisies += 1;
    const id = d.methode.trim() || d.methode;
    perMethode.set(id, (perMethode.get(id) ?? 0) + d.montantRecu);
  }

  const enAttente = totalRecu - totalDepose;

  const parMethode = [...perMethode.entries()]
    .map(([id, montant]) => ({
      id,
      label: config
        ? resolveMethodeLabel(id, config.listes.methodesPaiement)
        : id,
      montant,
      part: totalRecu > 0 ? Math.round((montant / totalRecu) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.montant - a.montant);

  const topMethode =
    parMethode.length > 0 && parMethode[0].montant > 0 ? parMethode[0] : null;

  return {
    totalRecu,
    totalDepose,
    enAttente,
    saisies,
    topMethode,
    parMethode,
  };
}

/* ===========================================================
   Validation du formulaire
   =========================================================== */

export type TresorerieFormErrors = Partial<{
  jourISO: string;
  montantRecu: string;
  depose: string;
  methode: string;
}>;

export type TresorerieDraft = {
  jourISO: string;
  montantRecu: number;
  depose: number;
  methode: string;
  note?: string;
};

export function validateTresorerieDraft(
  draft: TresorerieDraft
): TresorerieFormErrors {
  const errors: TresorerieFormErrors = {};

  if (!draft.jourISO) errors.jourISO = "Date requise.";
  if (!draft.methode.trim()) errors.methode = "Méthode requise.";
  if (!Number.isFinite(draft.montantRecu) || draft.montantRecu < 0) {
    errors.montantRecu = "Montant invalide.";
  }
  if (!Number.isFinite(draft.depose) || draft.depose < 0) {
    errors.depose = "Montant invalide.";
  }

  if (Object.keys(errors).length === 0) {
    if (draft.depose > draft.montantRecu) {
      errors.depose = `Le montant versé (${formatGNF(draft.depose)}) dépasse le reçu (${formatGNF(draft.montantRecu)}).`;
    }
    if (draft.montantRecu === 0 && draft.depose === 0) {
      errors.montantRecu = "Indique au moins un montant.";
    }
  }

  return errors;
}
