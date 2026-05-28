/**
 * Formatage ASCII-safe pour PDF, Excel et autres exports binaires.
 * Évite les espaces insécables (U+00A0, U+202F) et glyphes manquants (→)
 * qui provoquent des chiffres illisibles dans jsPDF.
 */

const UNICODE_SPACES = /\u00A0|\u202F|\u2009/g;
const ARROW = /\u2192|→/g;

/** Normalise espaces et flèches pour moteurs PDF basiques. */
export function formatTextForExport(text: string): string {
  return text.replace(UNICODE_SPACES, " ").replace(ARROW, " au ").trim();
}

/** Entier avec séparateur milliers = espace ASCII. */
export function formatPlainInteger(
  value: number | null | undefined
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const n = Math.round(value);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Montant GNF lisible en PDF / Excel — ex. "1 250 000 GNF". */
export function formatGNFForExport(
  value: number | null | undefined
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${formatPlainInteger(value)} GNF`;
}

/** Alvéoles entières pour exports tabulaires. */
export function formatAlveolesForExport(
  value: number | null | undefined
): string {
  return formatPlainInteger(value);
}
