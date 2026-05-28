/**
 * LanaFarm — Configuration globale du site.
 */

export const site = {
  name: "LanaFarm",
  shortName: "LanaFarm",
  tagline: "Gestion intelligente de ferme avicole",
  description:
    "LanaFarm — Plateforme de gestion intelligente de ferme avicole. Productions, ventes, dépenses, trésorerie et rapports — pensée pour le terrain.",
  locale: "fr",
  defaultRoute: "/dashboard",
} as const;

export type SiteConfig = typeof site;
