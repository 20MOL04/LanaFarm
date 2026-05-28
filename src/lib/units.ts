/**
 * Conversion d'unités — porte d'entrée unique LanaFarm.
 *
 * Règle métier : 1 alvéole / casier = `capacitePlateau` œufs (défaut 30).
 * Stockage interne (Production, Transferts, Stock magasin) : œufs entiers.
 * Affichage opérateur (KPI, saisie Production/Ventes) : alvéoles.
 */

export const EGGS_PER_TRAY_DEFAULT = 30;

/** Œufs → alvéoles (affichage — entiers uniquement). */
export function eggsToTrays(
  eggs: number,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): number {
  if (!Number.isFinite(eggs) || capacitePlateau <= 0) return 0;
  return Math.max(0, Math.round(eggs / capacitePlateau));
}

/** Alvéoles → œufs (persistance — entiers). */
export function traysToEggs(
  trays: number,
  capacitePlateau = EGGS_PER_TRAY_DEFAULT
): number {
  if (!Number.isFinite(trays) || capacitePlateau <= 0) return 0;
  return Math.max(0, Math.round(trays * capacitePlateau));
}
