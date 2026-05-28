/**
 * Valeurs par défaut + helpers pour la configuration de la ferme.
 * Source unique pour le seed initial et les opérations de reset.
 */

import {
  CATEGORIES_DEPENSES,
  METHODES_TRESORERIE,
  type ConfigCategorieDepenseItem,
  type ConfigMethodePaiementItem,
  type FarmConfig,
  type FarmListes,
  type FarmPreferences,
  type FarmProfil,
  type FarmSeuils,
  type MethodeTresorerie,
} from "@/types/domain";

/* ===========================================================
   Defaults par section
   =========================================================== */

export const DEFAULT_PROFIL: FarmProfil = {
  nom: "LanaFarm",
  ville: "Conakry",
  telephone: "+224 000 00 00 00",
};

export const DEFAULT_PREFERENCES: FarmPreferences = {
  prixPlateauGNF: 37_000,
  capacitePlateau: 30,
};

export const DEFAULT_SEUILS: FarmSeuils = {
  stockMagasinFaiblePlateaux: 20,
  tresorerieEnAttenteMaxGNF: 1_000_000,
  pertesHebdoMaxPct: 5,
};

/** 7 catégories de base avec métadonnées complètes. */
export function buildDefaultCategoriesDepense(): ConfigCategorieDepenseItem[] {
  return CATEGORIES_DEPENSES.map((c) => ({
    id: c.id,
    label: c.label,
    actif: true,
    isDefault: true,
  }));
}

export function buildDefaultMethodesPaiement(): ConfigMethodePaiementItem[] {
  return METHODES_TRESORERIE.map((m) => ({
    id: m.id,
    label: m.label,
    actif: true,
    isDefault: true,
  }));
}

export const DEFAULT_LISTES: FarmListes = {
  categoriesDepense: buildDefaultCategoriesDepense(),
  methodesPaiement: buildDefaultMethodesPaiement(),
};

export const DEFAULT_FARM_CONFIG: FarmConfig = {
  profil: DEFAULT_PROFIL,
  preferences: DEFAULT_PREFERENCES,
  seuils: DEFAULT_SEUILS,
  listes: DEFAULT_LISTES,
};

/* ===========================================================
   Helpers de lecture — labels effectifs
   =========================================================== */

/** Libellé effectif d'une entrée config (label obligatoire). */
export function getCategorieConfigLabel(item: ConfigCategorieDepenseItem): string {
  return item.label.trim() || item.id;
}

/**
 * Résout le libellé affichable d'une catégorie à partir de son ID stocké.
 * Compat ascendante : accepte encore un label humain (données B2.3).
 */
export function resolveCategorieLabel(
  categorieId: string,
  categories: ConfigCategorieDepenseItem[]
): string {
  const trimmed = categorieId.trim();
  if (!trimmed) return "";

  const byId = categories.find((c) => c.id === trimmed);
  if (byId) return getCategorieConfigLabel(byId);

  const byLabel = categories.find((c) => c.label.trim() === trimmed);
  if (byLabel) return getCategorieConfigLabel(byLabel);

  const ref = CATEGORIES_DEPENSES.find((c) => c.id === trimmed || c.label === trimmed);
  if (ref) return ref.label;

  return trimmed;
}

/** Résout via la config complète (helper UI). */
export function resolveCategorieLabelFromConfig(
  categorieId: string,
  config: FarmConfig
): string {
  return resolveCategorieLabel(categorieId, config.listes.categoriesDepense);
}

/** @deprecated Préférer resolveCategorieLabel — compat id technique. */
export function getCategorieLabelFromConfig(
  id: string,
  config: FarmConfig
): string {
  return resolveCategorieLabelFromConfig(id, config);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Migre Depense.categorie : labels humains → IDs config.
 * Les slugs et UUID déjà valides sont conservés.
 */
export function migrateDepensesCategories<T extends { categorie: string }>(
  depenses: T[],
  categories: ConfigCategorieDepenseItem[]
): T[] {
  const knownIds = new Set(categories.map((c) => c.id));

  return depenses.map((d) => {
    const raw = d.categorie.trim();
    if (!raw || knownIds.has(raw) || UUID_RE.test(raw)) return d;

    const byConfigLabel = categories.find((c) => c.label.trim() === raw);
    if (byConfigLabel) return { ...d, categorie: byConfigLabel.id };

    const ref = CATEGORIES_DEPENSES.find((c) => c.label === raw);
    if (ref) return { ...d, categorie: ref.id };

    return d;
  });
}

export function getMethodeConfigLabel(item: ConfigMethodePaiementItem): string {
  return item.label.trim() || item.id;
}

/**
 * Résout le libellé affichable d'une méthode à partir de son ID stocké.
 * Compat ascendante : accepte label humain ou legacy « banque ».
 */
export function resolveMethodeLabel(
  methodeId: string,
  methodes: ConfigMethodePaiementItem[]
): string {
  const trimmed = methodeId.trim();
  if (!trimmed) return "";

  if (trimmed === "banque") {
    return resolveMethodeLabel("virement", methodes);
  }

  const byId = methodes.find((m) => m.id === trimmed);
  if (byId) return getMethodeConfigLabel(byId);

  const byLabel = methodes.find((m) => m.label.trim() === trimmed);
  if (byLabel) return getMethodeConfigLabel(byLabel);

  const ref = METHODES_TRESORERIE.find((m) => m.id === trimmed || m.label === trimmed);
  if (ref) return ref.label;

  return trimmed;
}

export function resolveMethodeLabelFromConfig(
  methodeId: string,
  config: FarmConfig
): string {
  return resolveMethodeLabel(methodeId, config.listes.methodesPaiement);
}

/** @deprecated Préférer resolveMethodeLabel */
export function getMethodeLabelFromConfig(
  id: MethodeTresorerie,
  config: FarmConfig
): string {
  return resolveMethodeLabelFromConfig(id, config);
}

/**
 * Migre Tresorerie.methode : « banque » → « virement », labels → ids.
 */
/** Migre les entrées config : id « banque » → « virement ». */
export function migrateConfigMethodesPaiement(
  methodes: ConfigMethodePaiementItem[]
): ConfigMethodePaiementItem[] {
  const mapped = methodes.map((m) =>
    m.id === "banque"
      ? {
          ...m,
          id: "virement",
          label: m.label?.trim() || "Virement bancaire",
          isDefault: m.isDefault ?? true,
        }
      : m
  );
  const seen = new Set<string>();
  return mapped.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function migrateMethodesTresorerie<T extends { methode: string }>(
  lignes: T[],
  methodes: ConfigMethodePaiementItem[]
): T[] {
  const knownIds = new Set(methodes.map((m) => m.id));

  return lignes.map((d) => {
    let raw = d.methode.trim();
    if (!raw) return d;

    if (raw === "banque") raw = "virement";

    if (knownIds.has(raw) || UUID_RE.test(raw)) return { ...d, methode: raw };

    const byConfigLabel = methodes.find((m) => m.label.trim() === raw);
    if (byConfigLabel) return { ...d, methode: byConfigLabel.id };

    const ref = METHODES_TRESORERIE.find((m) => m.label === raw);
    if (ref) return { ...d, methode: ref.id };

    return { ...d, methode: raw };
  });
}

/** Méthodes actives pour les formulaires (libellés). */
export function getActiveMethodeLabels(config: FarmConfig): string[] {
  return config.listes.methodesPaiement
    .filter((m) => m.actif)
    .map((m) => getMethodeConfigLabel(m));
}

/** Catégories actives pour les formulaires (libellés). */
export function getActiveCategorieLabels(config: FarmConfig): string[] {
  return config.listes.categoriesDepense
    .filter((c) => c.actif)
    .map((c) => getCategorieConfigLabel(c));
}

/**
 * Vrai si la catégorie est activée (par id ou label stocké).
 * Absente du config → active (compat ascendante).
 */
export function isCategorieActive(
  categorieId: string,
  config: FarmConfig
): boolean {
  const trimmed = categorieId.trim();
  const item = config.listes.categoriesDepense.find(
    (c) => c.id === trimmed || c.label.trim() === trimmed
  );
  return item ? item.actif : true;
}

export function isMethodeActive(
  methodeId: string,
  config: FarmConfig
): boolean {
  const trimmed = methodeId.trim();
  const id = trimmed === "banque" ? "virement" : trimmed;
  const item = config.listes.methodesPaiement.find(
    (m) => m.id === id || m.label.trim() === trimmed
  );
  return item ? item.actif : true;
}
