/**
 * Terminologie métier officielle — libellés UI.
 * Conversions : {@link lib/units.ts}
 */

import { formatNumber } from "@/lib/format";
import {
  EGGS_PER_TRAY_DEFAULT,
  eggsToTrays,
} from "@/lib/units";

export { EGGS_PER_TRAY_DEFAULT, eggsToTrays } from "@/lib/units";

export const KPI_LABEL = {
  alveolesRamassees: "Alvéoles ramassées",
  alveolesMisesEnVente: "Alvéoles mises en vente",
  /** Σ restantes par jour sur la période (rapports) — distinct du stock instantané. */
  restantesPeriode: "Restantes sur la période",
  stockFerme: "Stock ferme",
  oeufsCasses: "Œufs cassés",
  stockVente: "Stock vente",
  chiffreAffaires: "Chiffre d'affaires",
  montantVerse: "Montant versé",
  resteAVerser: "Reste à verser",
  profit: "Profit",
  totalRecu: "Total reçu",
  depenses: "Dépenses",
  totalDepenses: "Total dépenses",
  methodePrincipale: "Méthode principale",
  moyenneJour: "Moyenne / jour",
  categoriePrincipale: "Catégorie principale",
} as const;

/** Hints KPI Production / stock — cohérence inter-modules. */
export const KPI_HINT = {
  periode: "Sur la période sélectionnée",
  alveolesRamassees: "Volume collecté sur la période",
  alveolesMisesEnVente: "Transféré vers les ventes sur la période",
  alveolesRestantes: "Reste à la ferme après transferts (Σ jours)",
  oeufsCasses: "Ferme + magasin",
  stockVente: "Invendus cumulés à la fin de la période",
  alveolesVendues: "Alvéoles vendues sur la période",
  prixCasier: "Prix par casier",
} as const;

export const SALES_LABEL = {
  alveolesVendues: "Alvéoles vendues",
  prixCasier: "Prix casier",
} as const;

export const MODULE_LABEL = {
  production: "Production",
  ventes: "Ventes",
  depenses: "Dépenses",
  tresorerie: "Trésorerie",
} as const;

export const UNIT_ALVEOLES = "alvéoles";
export const UNIT_OEUFS = "œufs";

const RE_TRAY_IN_LABEL = /alvéol/i;
const RE_EGG_IN_LABEL = /œuf/i;

/**
 * Règle UI : si le libellé mentionne déjà l'unité (ex. « Alvéoles ramassées »),
 * n'affiche pas « alvéoles » une seconde fois après le chiffre.
 */
export function unitSuffixForLabel(
  label: string,
  preferred?: string
): string | undefined {
  const u = preferred?.trim();
  if (!u) return undefined;
  if (u === UNIT_ALVEOLES && RE_TRAY_IN_LABEL.test(label)) return undefined;
  if (u === UNIT_OEUFS && RE_EGG_IN_LABEL.test(label)) return undefined;
  return u;
}

/** Libellés de champs (sans répéter l'unité — voir FIELD_HINT). */
export const FIELD_LABEL = {
  ramassees: "Ramassées",
  misesEnVente: "Mises en vente",
  vendues: "Vendues",
  casses: "Cassés",
  restantes: "Restantes",
  prixCasier: "Prix casier",
} as const;

export const FIELD_HINT = {
  quantiteAlveoles: "En alvéoles",
  quantiteOeufs: "En œufs",
} as const;

export function formatTraysNumber(
  eggs: number,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): string {
  return formatNumber(eggsToTrays(eggs, capacitePlateau));
}

/** Formate une quantité déjà exprimée en alvéoles. */
export function formatAlveolesNumber(trays: number): string {
  return formatNumber(trays);
}

export function formatEggsNumber(eggs: number): string {
  return formatNumber(eggs);
}
