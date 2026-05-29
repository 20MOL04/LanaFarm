import type { LucideIcon } from "lucide-react";

/** Entrée indexée — source unique pour la palette globale. */
export type GlobalSearchEntryKind =
  | "action"
  | "page"
  | "day"
  | "production"
  | "vente"
  | "depense"
  | "tresorerie"
  | "historique";

export type GlobalSearchEntry = {
  id: string;
  kind: GlobalSearchEntryKind;
  /** Groupe affiché dans la palette (Actions, Jours, Clients…). */
  group: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Texte normalisé pour la recherche plein-texte. */
  keywords: string;
  /** Plus haut = remonté en premier à score égal. */
  priority: number;
  jourISO?: string;
  icon?: LucideIcon;
};

export type GlobalSearchGroup = {
  id: string;
  label: string;
  entries: GlobalSearchEntry[];
};

export type GlobalSearchResult = {
  query: string;
  parsedDateISO: string | null;
  groups: GlobalSearchGroup[];
  total: number;
};
