/**
 * Classes d'affichage sémantiques — alignées sur les tokens CSS (`globals.css`).
 */

/** Œufs cassés / pertes — token `danger` (`text-danger`). */
export const brokenEggsValueClass =
  "font-semibold tabular-nums text-danger" as const;

/** Icônes d'action / navigation clés — token `accent-blue`. */
export const accentIconClass = "shrink-0 text-accent-blue" as const;

/** Surface carte / section — bordure + ombre token `shadow-card`. */
export const surfaceCardClass =
  "rounded-card border border-border bg-card shadow-card" as const;

/** Unité métrique (œufs, alvéoles) — plus petite que le chiffre. */
export const metricUnitClass =
  "text-[10px] font-medium leading-none text-muted sm:text-[11px]" as const;
