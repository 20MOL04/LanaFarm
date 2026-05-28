/**
 * Logique de calcul du module Dépenses.
 * Source unique de vérité — toute UI, KPI, ou agrégation passe par ces helpers.
 *
 * Règles métier :
 *   - Seules les dépenses au statut "actif" entrent dans les agrégats.
 *   - Total = Σ montant
 *   - Top catégorie = catégorie au montant cumulé le plus élevé
 *   - Moyenne par jour actif = Total / nb jours distincts ayant au moins une dépense
 *   - Profit cible (calculé ailleurs) = CA Ventes − Total Dépenses
 */

import { startOfDay } from "date-fns";

import { resolveCategorieLabel } from "@/lib/config-defaults";
import type { Depense, FarmConfig } from "@/types/domain";

function dayKey(iso: string): string {
  return startOfDay(new Date(iso)).toISOString();
}

/* ===========================================================
   Agrégats globaux
   =========================================================== */

export type ExpensesTotals = {
  total: number;
  saisies: number;
  joursActifs: number;
  moyenneJournaliere: number;
  topCategorie:
    | {
        id: string;
        label: string;
        montant: number;
        part: number;
      }
    | null;
  parCategorie: { id: string; label: string; montant: number; part: number }[];
};

export function aggregateExpenses(
  depenses: Depense[],
  config?: FarmConfig
): ExpensesTotals {
  let total = 0;
  let saisies = 0;
  const days = new Set<string>();
  const perCat = new Map<string, number>();

  for (const d of depenses) {
    if (d.statut !== "actif") continue;
    total += d.montant;
    saisies += 1;
    days.add(dayKey(d.jourISO));
    const id = d.categorie.trim();
    const key = id || d.categorie;
    perCat.set(key, (perCat.get(key) ?? 0) + d.montant);
  }

  const joursActifs = days.size;
  const moyenneJournaliere = joursActifs > 0 ? Math.round(total / joursActifs) : 0;

  const parCategorie = [...perCat.entries()]
    .map(([id, montant]) => ({
      id,
      label: config
        ? resolveCategorieLabel(id, config.listes.categoriesDepense)
        : id,
      montant,
      part: total > 0 ? Math.round((montant / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.montant - a.montant);

  const topCategorie =
    parCategorie.length > 0 && parCategorie[0].montant > 0 ? parCategorie[0] : null;

  return {
    total,
    saisies,
    joursActifs,
    moyenneJournaliere,
    topCategorie,
    parCategorie,
  };
}

/* ===========================================================
   Validation du formulaire
   =========================================================== */

export type ExpenseFormErrors = Partial<{
  jourISO: string;
  categorie: string;
  montant: string;
  description: string;
}>;

export type ExpenseDraft = {
  jourISO: string;
  categorie: string;
  montant: number;
  description?: string;
};

export function validateExpenseDraft(draft: ExpenseDraft): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  if (!draft.jourISO) errors.jourISO = "Date requise.";
  if (!draft.categorie.trim()) errors.categorie = "Catégorie requise.";
  if (!Number.isFinite(draft.montant) || draft.montant <= 0) {
    errors.montant = "Montant invalide.";
  }
  if (draft.description && draft.description.length > 240) {
    errors.description = "240 caractères maximum.";
  }

  return errors;
}
