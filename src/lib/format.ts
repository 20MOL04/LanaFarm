/**
 * Formatters cohérents pour toute l'application.
 * Devise officielle : GNF (Franc guinéen).
 * Locale / devise : alignés sur `app/globals.css` (Guinée).
 */

const CURRENCY_LOCALE = "fr-GN" as const;
const CURRENCY_CODE = "GNF" as const;
const CURRENCY_SYMBOL = "GNF" as const;

const gnfFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

/** Seuil à partir duquel on propose le format court (M, k) si manque de place. */
export const MILLION_THRESHOLD = 1_000_000;

/** Format monétaire complet — ex : "1 250 000 GNF". */
export function formatGNF(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return gnfFormatter.format(value);
}

/** Format monétaire compact — ex : "1,2 M GNF". */
export function formatGNFCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${compactFormatter.format(value)} ${CURRENCY_SYMBOL}`;
}

/** Nombre formaté à la française — ex : "12 540". */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

/** Format compact (œufs, plateaux, etc.) — ex : "12,5 k". */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return compactFormatter.format(value);
}

/** Pourcentage formaté — ex : "+12 %". */
export function formatPercent(value: number | null | undefined, withSign = true): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${Math.round(value)} %`;
}
