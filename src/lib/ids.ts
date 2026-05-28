/**
 * Générateur d'ID local — UUID pur (compatible Postgres / Supabase).
 *
 * Le paramètre `prefix` est conservé pour la compatibilité des appels existants
 * (`createId("prod")`, etc.) mais n'est plus inclus dans l'identifiant retourné.
 * En base : colonnes `uuid` avec `gen_random_uuid()` ou ids client identiques.
 */

let fallbackCounter = 0;

/** Forme UUID v4 minimale pour environnements sans `crypto.randomUUID`. */
function fallbackUuid(): string {
  fallbackCounter += 1;
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
}

export function createId(_prefix?: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return fallbackUuid();
}
