export type GuideHighlightKind = "page" | "action" | "finance" | "kbd";

export type GuideHighlightTerm = {
  kind: GuideHighlightKind;
  text: string;
};

/** Termes à mettre en valeur — ordre géré par longueur décroissante à l'exécution. */
export const GUIDE_HIGHLIGHT_TERMS: GuideHighlightTerm[] = [
  { kind: "action", text: "Générer le rapport" },
  { kind: "action", text: "Envoyer en Vente" },
  { kind: "action", text: "Restaurer cette version" },
  { kind: "action", text: "Revenir au live" },
  { kind: "action", text: "Nouvelle dépense" },
  { kind: "action", text: "Nouvelle saisie" },
  { kind: "action", text: "Plusieurs jours" },
  { kind: "action", text: "Ventes du jour" },
  { kind: "finance", text: "Chiffre d'affaires" },
  { kind: "finance", text: "Reste à verser" },
  { kind: "finance", text: "Montant versé" },
  { kind: "finance", text: "Stock ferme" },
  { kind: "finance", text: "Stock vente" },
  { kind: "finance", text: "Total reçu" },
  { kind: "finance", text: "Dépenses" },
  { kind: "finance", text: "Profit" },
  { kind: "page", text: "Historique" },
  { kind: "page", text: "Paramètres" },
  { kind: "page", text: "Trésorerie" },
  { kind: "page", text: "Production" },
  { kind: "page", text: "Dashboard" },
  { kind: "page", text: "Rapports" },
  { kind: "page", text: "Dépenses" },
  { kind: "page", text: "LanaFarm" },
  { kind: "page", text: "Ventes" },
  { kind: "page", text: "Guide" },
  { kind: "action", text: "Enregistrer" },
  { kind: "action", text: "Modifier" },
  { kind: "action", text: "Restaurer" },
  { kind: "action", text: "Confirmer" },
  { kind: "action", text: "Annuler" },
  { kind: "kbd", text: "Ctrl+K" },
  { kind: "kbd", text: "Cmd+K" },
  { kind: "kbd", text: "Entrée" },
  { kind: "kbd", text: "Échap" },
];
