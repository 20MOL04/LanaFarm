/** Modale calée sur le contenu — pas de bande vide à droite. */
export const DIALOG_FIT_CONTENT = "!w-max !max-w-[min(100vw-1rem,100%)]";

/** Plafond mode 1 jour (saisie terrain). */
export const DIALOG_SINGLE_MAX = "sm:!max-w-[min(100vw-1rem,28rem)]";

/** Enveloppe interne (header + form). */
export const DIALOG_INNER = "flex w-full min-w-0 max-w-full flex-col";

export const DIALOG_BODY = "w-full min-w-0 shrink-0 gap-3";
export const DIALOG_FORM = "flex w-full min-w-0 flex-col overflow-visible";

/** Scroll lignes uniquement si > ~6 lignes. */
export const DIALOG_SCROLL =
  "w-full min-w-0 max-h-[min(14rem,40dvh)] overflow-y-auto overflow-x-visible overscroll-contain";

/** Champs mode 1 jour */
export const FORM_INPUT_NUM = "h-8 w-full tabular-nums px-1.5";
export const FORM_INPUT_NUM_ICON = "h-8 w-full pl-8 pr-1.5 tabular-nums";
export const FORM_INPUT_PRICE = "h-8 w-full tabular-nums px-1.5";
export const FORM_INPUT_MONTANT = "h-8 w-full pl-8 pr-1.5 tabular-nums";
export const FORM_INPUT_TEXT = "h-8 w-full min-w-0 px-1.5";
export const FORM_INPUT_NOTES = "h-8 w-full min-w-0 px-1.5";

export const FORM_LINE_CARD =
  "w-full space-y-2.5 rounded-card border border-border bg-card-muted p-2.5";

/** Ligne 1 : deux champs côte à côte (qté + prix, catégorie + montant). */
export const FORM_LINE_GRID_2 = "grid grid-cols-2 gap-x-3 gap-y-2";

export const FORM_LINE_ROW_END = "flex items-end gap-2";

export const FORM_NUM_FIELDS_ROW = "flex flex-wrap items-start gap-x-3 gap-y-2";

/**
 * Tableaux multi-jours — colonnes = largeur libellé (une ligne).
 */
export const MULTI_DAY_TABLE = {
  root: "w-max max-w-full border-collapse text-left text-sm",
  wrap: "inline-block max-w-full overflow-x-auto rounded-card border border-border",
  th: "whitespace-nowrap px-2 py-2 text-left text-[10px] font-medium text-muted",
  td: "px-2 py-1.5 align-top",
  col: {
    day: "min-w-[5.75rem]",
    vendus: "min-w-[6.25rem]",
    prix: "min-w-[7.5rem]",
    client: "min-w-[8.75rem]",
    cassesAlv: "min-w-[6.5rem]",
    ramassees: "min-w-[7.25rem]",
    misesEnVente: "min-w-[9.5rem]",
    cassesOeufs: "min-w-[6.75rem]",
    category: "min-w-[8.5rem]",
    montant: "min-w-[7.25rem]",
    description: "min-w-[7.5rem]",
    action: "w-9 min-w-[2.25rem]",
  },
} as const;

export const MULTI_DAY_INPUT_NUM =
  "h-8 w-[5rem] max-w-full tabular-nums px-1.5";

export const MULTI_DAY_INPUT_PRICE =
  "h-8 w-[6.5rem] max-w-full tabular-nums px-1.5";

export const MULTI_DAY_INPUT_TEXT = "h-8 w-full max-w-[9rem] min-w-0 px-1.5";
