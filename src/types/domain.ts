/**
 * Modèle de domaine LanaFarm.
 * Reflète le cahier des charges (V1, MVP).
 * Stockage cible : Supabase (à brancher dans une prochaine étape).
 *
 * Unités persistance : `production` et `envoyesVente` en œufs ;
 * affichage opérateur en alvéoles via lib/units.ts.
 */

export type ISODate = string;

/* ===========================================================
   Statut commun des entrées métier — soft-delete
   -----------------------------------------------------------
   "actif"    : entrée prise en compte dans les KPI/calculs
   "annule"   : annulée par l'utilisateur (exclue des calculs)
   "archive"  : conservée long terme (semaine archivée)
   =========================================================== */

export type EntreeStatut = "actif" | "annule" | "archive";

/* ===========================================================
   Production
   =========================================================== */

export type Production = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  jourISO: ISODate;
  /** Œufs collectés (équivalent alvéoles ramassées × capacitePlateau). */
  production: number;
  /** Œufs cassés à la ferme — pertes, unité secondaire. */
  casses: number;
  /** Œufs transférés vers le magasin (équivalent alvéoles mises en vente). */
  envoyesVente: number;
  /** Note libre, optionnelle. */
  notes?: string;
  /** Rattachement à une semaine (legacy) — optionnel ; plus assigné aux nouvelles entrées. */
  semaineId?: string;
  /** Lignée stable — relie l'entrée active et ses versions archivées (R6C). */
  lineageId?: string;
  /** Motif d'archivage (ex. « modifié »). */
  archiveMotif?: string;
  statut: EntreeStatut;
  createdAt: ISODate;
  updatedAt: ISODate;
};

/**
 * Calcul automatique — alvéoles restantes (affichage) :
 *    restantes = ramassées − mises en vente  (via lib/production-calc.ts)
 */

/* ===========================================================
   Ventes
   =========================================================== */

export type Vente = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  jourISO: ISODate;
  /**
   * Œufs vendus — persistance interne ; saisie UI en alvéoles.
   */
  vendus: number;
  /** Pertes côté vente — cassés, transport (saisi en œufs). */
  cassesVente: number;
  /** Prix par casier / alvéole en GNF (saisi). */
  prix: number;
  /**
   * @derived — calculé depuis vendus × prix (via `computeVenteSnapshot`).
   * Ne pas stocker en DB : colonne générée en Supabase. Recalculer à chaque écriture.
   */
  montant: number;
  client?: string;
  /** Rattachement à une semaine (legacy) — optionnel. */
  semaineId?: string;
  /** Lignée stable — relie l'entrée active et ses versions archivées (R6C). */
  lineageId?: string;
  /** Motif d'archivage (ex. « modifié »). */
  archiveMotif?: string;
  statut: EntreeStatut;
  createdAt: ISODate;
  updatedAt: ISODate;
  /**
   * @derived — snapshot recuFerme au moment de la saisie (Σ production.envoyesVente du jour).
   * @deprecated Affichage : préférer `buildSaleRowViews()` / `indexEnvoisFermeByDay()`.
   * Ne pas stocker en DB : colonne générée ou recalculée. Rempli par `computeVenteSnapshot()`.
   */
  recuFerme: number;
  /**
   * @derived — snapshot reste vente au moment de la saisie.
   * @deprecated Affichage : préférer `buildSaleRowViews()`.
   * Ne pas stocker en DB : colonne générée ou recalculée. Rempli par `computeVenteSnapshot()`.
   */
  resteVente: number;
};

/** Prix usuels — proposés en suggestion, mais saisie manuelle autorisée. */
export const PRIX_SUGGERES_GNF: number[] = [35000, 36000, 37000, 38000, 40000];

/* ===========================================================
   Dépenses
   =========================================================== */

/** ID de catégorie (slug seed ou UUID custom). */
export type CategorieDepense = string;

/** Seed de référence — 7 catégories de base (ids stables). */
export const CATEGORIES_DEPENSES: { id: string; label: string }[] = [
  { id: "alimentation", label: "Alimentation animale" },
  { id: "main-d-oeuvre", label: "Main d'œuvre" },
  { id: "transport", label: "Transport" },
  { id: "emballage", label: "Emballage / Plateaux" },
  { id: "sante", label: "Santé / Vétérinaire" },
  { id: "infrastructure", label: "Infrastructure / Entretien" },
  { id: "divers", label: "Divers" },
];

export type Depense = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  jourISO: ISODate;
  categorie: CategorieDepense;
  montant: number;
  description?: string;
  /** Rattachement à une semaine (legacy) — optionnel. */
  semaineId?: string;
  /** Lignée stable — relie l'entrée active et ses versions archivées (R6C). */
  lineageId?: string;
  /** Motif d'archivage (ex. « modifié »). */
  archiveMotif?: string;
  statut: EntreeStatut;
  createdAt: ISODate;
  updatedAt: ISODate;
};

/* ===========================================================
   Trésorerie (saisies de versements)
   =========================================================== */

/** ID de méthode de paiement (slug seed ou UUID custom). */
export type MethodeTresorerie = string;

/** Seed de référence — 4 méthodes de base (ids stables). */
export const METHODES_TRESORERIE: { id: string; label: string }[] = [
  { id: "cash", label: "Espèces" },
  { id: "virement", label: "Virement bancaire" },
  { id: "orange-money", label: "Orange Money" },
  { id: "mtn-money", label: "MTN Money" },
];

export type Tresorerie = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  jourISO: ISODate;
  montantRecu: number;
  /** Montant déjà versé (GNF). */
  depose: number;
  /** Reste à verser (auto : montantRecu − depose). */
  reste: number;
  methode: MethodeTresorerie;
  note?: string;
  /** Rattachement à une semaine (legacy) — optionnel. */
  semaineId?: string;
  /** Lignée stable — relie l'entrée active et ses versions archivées (R6C). */
  lineageId?: string;
  /** Motif d'archivage (ex. « modifié »). */
  archiveMotif?: string;
  statut: EntreeStatut;
  createdAt: ISODate;
  updatedAt: ISODate;
};

/* ===========================================================
   Transferts de stock (Ferme → Magasin)
   -----------------------------------------------------------
   Matérialise un envoi d'œufs de la production vers les ventes.
   Un transfert nait automatiquement de toute saisie Production
   avec envoyesVente > 0. Statuts :
     - "en_attente" : envoyé, pas encore confirmé côté Ventes
     - "recu"       : confirmé (auto ou manuel)
     - "conteste"   : écart non résolu / production annulée
   En V1 LanaFarm, auto-confirmation activée (mono-site).
   =========================================================== */

export type TransfertStatut = "en_attente" | "recu" | "conteste";

export type TransfertStock = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  /**
   * Production source — traçabilité bidirectionnelle.
   * Absent pour les transferts manuels (envoi ferme → magasin sans collecte).
   */
  productionId?: string;
  /** Jour de déclaration côté Production. */
  jourEnvoiISO: ISODate;
  /** Jour de confirmation côté Ventes (auto = jourEnvoiISO). */
  jourReceptionISO?: ISODate;
  /** Quantité déclarée par Production. */
  quantiteEnvoyee: number;
  /** Quantité confirmée par Ventes — absent tant que statut = "en_attente". */
  quantiteRecue?: number;
  /** Écart auto : quantiteRecue − quantiteEnvoyee (négatif = manquant). */
  ecart?: number;
  /** Note libre en cas d'écart ou contestation. */
  noteEcart?: string;
  statut: TransfertStatut;
  /** True si confirmé automatiquement à la création (V1 mono-site). */
  autoConfirm: boolean;
  /** Rattachement semaine (legacy, basé sur jourEnvoiISO) — optionnel. */
  semaineId?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

/* ===========================================================
   KPI agrégés du dashboard
   =========================================================== */

export type DashboardKpis = {
  stockFerme: number;
  stockVente: number;
  totalVentes: number;
  totalDepenses: number;
  pertesTotales: number;
  tresorerieValidee: number;
  montantEnAttente: number;
  beneficeEstime: number;
};

/* ===========================================================
   Journal d'actions (historique)
   -----------------------------------------------------------
   Posé maintenant pour rester scalable. Chaque mutation
   importante doit écrire une entrée ici.
   =========================================================== */

export type ActionType =
  | "creation"
  | "modification"
  | "annulation"
  | "restauration"
  | "validation"
  | "reouverture"
  | "archivage";

export type Module =
  | "production"
  | "vente"
  | "depense"
  | "tresorerie"
  | "transfert"
  | "semaine";

export type ActionLog = {
  id: string;
  /** farm_id — requis pour Supabase RLS. Assigné automatiquement à la connexion. */
  farm_id?: string;
  dateISO: ISODate;
  type: ActionType;
  module: Module;
  /** Référence vers l'entité concernée. */
  cibleId: string;
  /** Description lisible pour le journal. */
  description: string;
  /** Champ modifié (si modification). */
  champ?: string;
  ancienneValeur?: string | number | null;
  nouvelleValeur?: string | number | null;
  /** Identifiant utilisateur — à brancher avec l'auth V2. */
  utilisateur?: string;
};

/* ===========================================================
   Configuration de la ferme (state.config)
   -----------------------------------------------------------
   Centralise les paramètres métier : profil, préférences,
   seuils d'alerte (consommés par le Dashboard) et listes
   métier éditables (catégories, méthodes).
   Stocké en V1 dans le store unifié ; sera persisté plus tard
   dans Supabase (table `farm_config` mono-ligne).
   =========================================================== */

/** Catégorie de dépense configurable (défaut ou custom). */
export type ConfigCategorieDepenseItem = {
  id: string;
  label: string;
  actif: boolean;
  isDefault: boolean;
};

/**
 * Override d'une méthode de paiement typée.
 * Même contrainte : `id` reste l'union, label + actif éditables.
 */
export type ConfigMethodePaiementItem = {
  id: string;
  label: string;
  actif: boolean;
  isDefault: boolean;
};

export type FarmProfil = {
  nom: string;
  ville: string;
  telephone: string;
};

export type FarmPreferences = {
  /** Prix moyen d'un plateau en GNF — pré-remplit le formulaire de vente. */
  prixPlateauGNF: number;
  /** Nombre d'œufs par plateau (alvéoles). */
  capacitePlateau: number;
};

export type FarmSeuils = {
  /** Stock vente faible — seuil en alvéoles / plateaux. */
  stockMagasinFaiblePlateaux: number;
  /** Montant max acceptable d'argent encaissé mais non remis (GNF). */
  tresorerieEnAttenteMaxGNF: number;
  /** Pertes hebdomadaires acceptables — exprimées en % de la production. */
  pertesHebdoMaxPct: number;
};

export type FarmListes = {
  categoriesDepense: ConfigCategorieDepenseItem[];
  methodesPaiement: ConfigMethodePaiementItem[];
};

/**
 * Configuration opérationnelle de la ferme (store V1 monolithique).
 *
 * CONFIG SUPABASE (cible migration) :
 * - `FarmProfil` → table `farm_profiles`
 * - `FarmPreferences` → table `farm_preferences`
 * - `FarmSeuils` → table `farm_seuils`
 * - `FarmListes.categoriesDepense` → table `categories_depense`
 * - `FarmListes.methodesPaiement` → table `methodes_paiement`
 *
 * Voir aussi `src/types/supabase-schema.ts` pour les types ligne Postgres.
 */
export type FarmConfig = {
  profil: FarmProfil;
  preferences: FarmPreferences;
  seuils: FarmSeuils;
  listes: FarmListes;
};
