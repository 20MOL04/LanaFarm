/**
 * Types cibles pour les tables Supabase (documentation + contrats).
 * Aucun client ni requête ici — voir `src/lib/supabase/` et `src/services/`.
 */

/** Ligne `categories_depense`. */
export type CategorieDepenseRow = {
  id: string;
  label: string;
  actif: boolean;
  is_default: boolean;
  farm_id: string;
  created_at: string;
  updated_at: string;
};

/** Ligne `methodes_paiement`. */
export type MethodePaiementRow = {
  id: string;
  label: string;
  actif: boolean;
  is_default: boolean;
  farm_id: string;
  created_at: string;
  updated_at: string;
};

/** Ligne `farm_profiles` (équivalent `FarmProfil`). */
export type FarmProfileRow = {
  farm_id: string;
  nom: string;
  ville: string;
  telephone: string;
  created_at: string;
  updated_at: string;
};

/** Ligne `farm_preferences` (équivalent `FarmPreferences`). */
export type FarmPreferencesRow = {
  farm_id: string;
  prix_plateau_gnf: number;
  capacite_plateau: number;
  created_at: string;
  updated_at: string;
};

/** Ligne `farm_seuils` (équivalent `FarmSeuils`). */
export type FarmSeuilsRow = {
  farm_id: string;
  stock_magasin_faible_plateaux: number;
  tresorerie_en_attente_max_gnf: number;
  pertes_hebdo_max_pct: number;
  created_at: string;
  updated_at: string;
};

/** Ligne `farm_notifications` — centre de notifications (cloche). */
export type FarmNotificationRow = {
  id: string;
  farm_id: string;
  notification_key: string;
  level: string;
  module: string;
  title: string;
  description: string;
  href: string;
  query_json: Record<string, string> | null;
  meta_json: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  resolved_at: string | null;
};

/** Ligne `farm_reports` — rapport archivé (snapshot JSON). */
export type FarmReportRow = {
  id: string;
  farm_id: string;
  report_type: string;
  period_label: string;
  period_from: string;
  period_to: string;
  payload_json: Record<string, unknown>;
  generated_at: string;
  created_by: string | null;
};
