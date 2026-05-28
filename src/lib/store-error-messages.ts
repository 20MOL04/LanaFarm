/**
 * Messages UI pour les erreurs métier du store unifié.
 * Codes émis par farm-store.tsx (setStoreError).
 */

const STORE_ERROR_MESSAGES: Record<string, string> = {
  PRODUCTION_DAY_EXISTS:
    "Une production existe déjà pour ce jour. Modifiez l'entrée existante.",
  STOCK_INSUFFISANT:
    "Stock magasin insuffisant pour cette vente.",
  STOCK_INSUFFISANT_BATCH:
    "Stock insuffisant pour une ou plusieurs lignes.",
  DEPENSE_BATCH_INVALID:
    "Vérifiez les lignes : catégorie et montant requis.",
};

export function getStoreErrorMessage(
  code: string,
  fallback?: string
): string {
  return STORE_ERROR_MESSAGES[code] ?? fallback ?? "Une erreur est survenue.";
}
