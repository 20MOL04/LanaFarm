/** Normalise une chaîne pour la recherche (minuscules, sans accents). */
export function normalizeSearchText(value: string | undefined | null): string {
  return (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Extrait les chiffres d'un montant saisi (espaces, GNF, virgules). */
export function normalizeAmountQuery(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/** Tokenise une requête en mots significatifs. */
export function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((t) => t.length >= 1);
}
