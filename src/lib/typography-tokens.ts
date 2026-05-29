/**
 * Typographie sémantique — alignée sur les tokens CSS (`globals.css`).
 * Préférer ces classes aux tailles en pixels hardcodées.
 */

/** Plus petit — badges compacts, compteurs (≥11px). */
export const textMicroClass = "text-micro font-medium leading-tight" as const;

/** Légende — labels KPI, en-têtes tableau denses, groupes nav. */
export const textCaptionClass =
  "text-caption font-medium leading-snug text-muted" as const;

/** Libellé — champs formulaire, hints, texte secondaire. */
export const textLabelClass = "text-label font-medium leading-snug" as const;

/** Corps réduit — cellules table, descriptions courtes. */
export const textBodySmClass = "text-body-sm font-medium leading-snug" as const;

/** Corps — texte courant, contenu principal. */
export const textBodyClass = "text-body font-medium leading-normal" as const;

/** Navigation — liens sidebar, menu principal. */
export const textNavClass = "text-nav font-medium leading-snug" as const;

/** Groupe nav — titres de section sidebar / menu. */
export const textNavGroupClass =
  "text-caption font-semibold uppercase tracking-wider text-sidebar-muted" as const;

/** Tableau — taille de base des cellules. */
export const tableTextClass = "text-body-sm" as const;

/** En-tête de colonne tableau. */
export const tableHeaderClass =
  "text-label font-medium text-muted" as const;

/** Label KPI (carte dashboard). */
export const kpiLabelClass =
  "truncate text-caption font-medium leading-snug text-muted" as const;

/** Hint sous valeur KPI. */
export const kpiHintClass = "truncate text-label text-muted" as const;

/** Titre de page (h1 module). */
export const pageTitleClass =
  "text-page font-semibold leading-tight tracking-tight text-foreground" as const;

/** Sous-titre de page. */
export const pageDescClass = "text-body-sm font-medium text-muted" as const;

/** Libellé de champ formulaire. */
export const formFieldLabelClass =
  "flex items-center gap-1 text-label font-medium text-foreground" as const;

/** Hint / erreur sous champ. */
export const formHintClass = "text-caption text-muted" as const;
export const formErrorClass = "text-caption text-danger" as const;

/** En-tête multi-jours (tableaux saisie). */
export const multiDayTableHeaderClass =
  "whitespace-nowrap px-2 py-1.5 text-left text-caption font-medium text-muted" as const;
