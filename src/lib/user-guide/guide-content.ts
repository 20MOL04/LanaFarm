import type { GuideSection } from "@/lib/user-guide/types";

export const GUIDE_INTRO = {
  title: "Guide d'utilisation",
  subtitle:
    "Tout ce qu'il faut savoir pour utiliser LanaFarm au quotidien, expliqué simplement.",
  intro: {
    appParagraph:
      "LanaFarm est l'application qui vous permet de suivre votre ferme avicole au quotidien. Production, ventes, dépenses, trésorerie — tout est au même endroit, toujours à jour.",
    guideParagraph:
      "Ce guide vous explique chaque partie de l'application. Lisez-le une première fois du début à la fin, puis revenez à la section qui vous intéresse quand vous en avez besoin.",
    checklistTitle: "Vous trouverez dans ce guide :",
    checklistItems: [
      "Comment saisir votre production chaque jour",
      "Comment enregistrer vos ventes",
      "Comment suivre vos dépenses et vos versements",
      "Comment lire les chiffres qui s'affichent",
      "Comment corriger une erreur",
      "Ce que signifie chaque alerte",
    ],
  },
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "dashboard",
    title: "Le tableau de bord (Dashboard)",
    blocks: [
      {
        type: "p",
        text: "Le tableau de bord est la première page que vous voyez en ouvrant LanaFarm. Il résume l'état de votre ferme en un coup d'œil.",
      },
      {
        type: "p",
        text: "En haut, vous trouvez huit grandes cartes avec les chiffres les plus importants :",
      },
      {
        type: "ul",
        items: [
          "Stock ferme : le nombre d'alvéoles actuellement à la ferme, pas encore parties vers le magasin.",
          "Stock vente : le nombre d'alvéoles disponibles au magasin, pas encore vendues.",
          "Chiffre d'affaires : l'argent rapporté par les ventes sur la période que vous avez choisie.",
          "Profit : ce qui reste après avoir soustrait les dépenses du chiffre d'affaires, sur la période choisie.",
          "Montant versé : la somme qui a déjà été versée à la ferme sur la période.",
          "Reste à verser : l'argent qui doit encore être remis à la ferme. Ce chiffre est calculé depuis le tout premier jour, pas seulement sur la période affichée.",
          "Dépenses : le total des sorties d'argent sur la période choisie.",
          "Œufs cassés : les pertes enregistrées sur la période.",
        ],
      },
      {
        type: "p",
        text: "En dessous des cartes, le graphique d'Activité montre l'évolution jour par jour. Vous pouvez choisir d'afficher le Profit, le Chiffre d'affaires, les Dépenses ou la Production en cliquant sur les onglets au-dessus du graphique.",
      },
      {
        type: "p",
        text: "À droite, des raccourcis vous permettent d'aller directement saisir une production, une vente, une dépense ou un versement.",
      },
      {
        type: "p",
        text: "En bas, l'Activité récente liste les quatre dernières actions enregistrées dans l'application.",
      },
      {
        type: "links",
        links: [{ label: "Voir le Dashboard", href: "/dashboard" }],
      },
    ],
  },
  {
    id: "periode",
    title: "Le filtre de période",
    blocks: [
      {
        type: "p",
        text: "En haut à droite de toutes les pages, vous voyez une plage de dates comme « 25 → 31 mai 2026 ». C'est le filtre de période.",
      },
      {
        type: "p",
        text: "Cliquez dessus pour choisir :",
      },
      {
        type: "ul",
        items: [
          "Cette semaine",
          "Ce mois-ci",
          "Personnalisé : choisissez vous-même une date de début et une date de fin",
        ],
      },
      {
        type: "p",
        text: "Quand vous changez la période, les chiffres de ventes, dépenses, production et profit se mettent à jour. Les tableaux affichent uniquement les saisies de cette période.",
      },
      {
        type: "p",
        text: "En revanche, trois chiffres ne changent jamais avec la période :",
      },
      {
        type: "ul",
        items: ["Stock ferme", "Stock vente", "Reste à verser"],
      },
      {
        type: "p",
        text: "Ces trois valeurs reflètent toujours la situation réelle à l'instant présent, depuis le tout début de l'utilisation de l'application.",
      },
    ],
  },
  {
    id: "recherche",
    title: "La recherche",
    blocks: [
      {
        type: "p",
        text: "La barre de recherche se trouve en haut à gauche de toutes les pages. Sur ordinateur, vous pouvez aussi l'ouvrir avec Ctrl+K.",
      },
      {
        type: "p",
        text: "Tapez un nom de client, une date, un montant ou une catégorie. L'application trouve les entrées correspondantes dans toutes les sections et vous y amène directement.",
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    blocks: [
      {
        type: "p",
        text: "La page Production est l'endroit où vous enregistrez ce qui se passe chaque jour à la ferme : combien d'alvéoles ont été ramassées, combien ont été envoyées vers le magasin, et les cassés.",
      },
      {
        type: "p",
        text: "En haut, quatre cartes résument la période en cours :",
      },
      {
        type: "ul",
        items: [
          "Alvéoles ramassées : tout ce qui a été collecté.",
          "Alvéoles mises en vente : tout ce qui a été envoyé au magasin.",
          "Stock ferme : ce qui reste à la ferme en ce moment (toujours à jour).",
          "Œufs cassés : les pertes de la période.",
        ],
      },
      {
        type: "p",
        text: "Le tableau en dessous liste toutes vos saisies avec les colonnes : Jour, Ramassées, Mises en vente, Restantes, Cassés, Statut.",
      },
      {
        type: "p",
        text: "Par défaut, le tableau montre les saisies actives de la période choisie. Vous pouvez filtrer pour voir aussi les saisies annulées ou archivées.",
      },
      {
        type: "h3",
        text: "Comment saisir la production du jour",
      },
      {
        type: "ol",
        items: [
          "Cliquez sur Nouvelle saisie.",
          "Choisissez le jour. L'application propose automatiquement aujourd'hui.",
          "Indiquez le nombre d'alvéoles ramassées.",
          "Si vous avez envoyé des alvéoles au magasin ce même jour, indiquez-le dans Mises en vente.",
          "Si des œufs ont été cassés, indiquez-le.",
          "Ajoutez une note si vous le souhaitez.",
          "Cliquez sur Enregistrer.",
        ],
      },
      {
        type: "p",
        text: "En bas du formulaire, un aperçu vous montre combien d'alvéoles resteront à la ferme après enregistrement.",
      },
      {
        type: "p",
        text: "Une seule saisie par jour est possible. Si vous essayez d'enregistrer un jour déjà saisi, l'application vous le signale. Utilisez Modifier sur la ligne existante à la place.",
      },
      {
        type: "h3",
        text: "Comment saisir plusieurs jours à la fois",
      },
      {
        type: "p",
        text: "Si vous avez oublié de saisir plusieurs jours, cliquez sur Plusieurs jours en haut du formulaire. Choisissez la période. Une ligne apparaît pour chaque jour. Remplissez les jours que vous voulez et laissez vides ceux que vous ne voulez pas enregistrer. Si un jour a déjà une saisie, l'application vous propose de le remplacer ou de l'ignorer.",
      },
      {
        type: "h3",
        text: "Comment envoyer des alvéoles au magasin",
      },
      {
        type: "p",
        text: "Le bouton Envoyer en Vente en haut de la page ouvre un formulaire séparé. Indiquez le jour et le nombre d'alvéoles à envoyer. À la validation, le stock ferme diminue et le stock vente augmente du même nombre. Si vous essayez d'envoyer plus que ce qui est disponible à la ferme, l'application bloque et affiche un message d'erreur.",
      },
      {
        type: "links",
        links: [{ label: "Aller à la Production", href: "/production" }],
      },
    ],
  },
  {
    id: "ventes",
    title: "Ventes",
    blocks: [
      {
        type: "p",
        text: "La page Ventes est l'endroit où vous enregistrez ce qui a été vendu au magasin ou à des clients.",
      },
      {
        type: "p",
        text: "En haut, quatre cartes résument :",
      },
      {
        type: "ul",
        items: [
          "Stock vente : invendus disponibles en ce moment.",
          "Alvéoles vendues : volume vendu sur la période.",
          "Chiffre d'affaires : argent des ventes sur la période.",
          "Reste à verser : argent pas encore remis à la ferme (chiffre global).",
        ],
      },
      {
        type: "p",
        text: "Le tableau liste vos ventes avec les colonnes : Jour, Reçu, Vendu, Reste, Prix, Montant, Statut.",
      },
      {
        type: "p",
        text: "Juste au-dessus du tableau, le panneau Réceptions montre les alvéoles reçues du magasin depuis la ferme. Pour chaque envoi, vous voyez la date, la quantité envoyée et la quantité reçue. Si un envoi est en attente de confirmation, un bouton Confirmer apparaît.",
      },
      {
        type: "h3",
        text: "Comment saisir une vente",
      },
      {
        type: "p",
        text: "Cliquez sur Ventes du jour. Choisissez le jour. Pour chaque vente, indiquez le nombre d'alvéoles vendues, le prix du casier, et le nom du client si vous le connaissez. Vous pouvez ajouter plusieurs lignes de vente pour un même jour si vous avez vendu à des prix ou des clients différents. En bas, l'application affiche le stock disponible et ce qu'il restera après enregistrement. Si vous essayez de vendre plus que le stock disponible, l'enregistrement est bloqué avec un message d'erreur.",
      },
      {
        type: "links",
        links: [{ label: "Aller aux Ventes", href: "/ventes" }],
      },
    ],
  },
  {
    id: "depenses",
    title: "Dépenses",
    blocks: [
      {
        type: "p",
        text: "La page Dépenses est l'endroit où vous enregistrez toutes les sorties d'argent : alimentation des poules, salaires, transport, emballage, et tout autre frais.",
      },
      {
        type: "p",
        text: "En haut, quatre cartes résument :",
      },
      {
        type: "ul",
        items: [
          "Total dépenses sur la période.",
          "Catégorie principale : la catégorie la plus utilisée sur la période.",
          "Moyenne par jour : dépense journalière moyenne sur la période.",
          "Dépenses cette semaine.",
        ],
      },
      {
        type: "p",
        text: "Le tableau liste les dépenses avec : Jour, Catégorie, Montant, Description, Statut.",
      },
      {
        type: "h3",
        text: "Comment saisir une dépense",
      },
      {
        type: "ol",
        items: [
          "Cliquez sur Nouvelle dépense.",
          "Choisissez le jour.",
          "Sélectionnez la catégorie dans la liste.",
          "Indiquez le montant en francs guinéens.",
          "Ajoutez une description si vous voulez.",
          "Enregistrez.",
        ],
      },
      {
        type: "p",
        text: "Vous pouvez saisir plusieurs dépenses le même jour, chacune avec sa catégorie et son montant.",
      },
      {
        type: "p",
        text: "Les catégories disponibles se gèrent dans Paramètres, section Listes métier.",
      },
      {
        type: "links",
        links: [{ label: "Aller aux Dépenses", href: "/depenses" }],
      },
    ],
  },
  {
    id: "tresorerie",
    title: "Trésorerie",
    blocks: [
      {
        type: "p",
        text: "La page Trésorerie est l'endroit où vous enregistrez l'argent reçu des ventes et les versements que vous faites à la ferme.",
      },
      {
        type: "p",
        text: "En haut, quatre cartes résument :",
      },
      {
        type: "ul",
        items: [
          "Total reçu sur la période.",
          "Montant versé sur la période.",
          "Reste à verser : ce qui doit encore être remis à la ferme, calculé depuis le début.",
          "Méthode principale : le mode de paiement le plus utilisé.",
        ],
      },
      {
        type: "p",
        text: "Le tableau liste les versements avec : Jour, Versé, Reste, Méthode, Statut.",
      },
      {
        type: "h3",
        text: "Comment enregistrer un versement",
      },
      {
        type: "ol",
        items: [
          "Cliquez sur Nouvelle saisie.",
          "Choisissez le jour.",
          "Choisissez la méthode de paiement (espèces, Orange Money, MTN, virement…).",
          "Indiquez le montant versé.",
          "Enregistrez.",
        ],
      },
      {
        type: "p",
        text: "Avant d'enregistrer, l'application affiche un contexte avec le chiffre d'affaires de la période, les dépenses et le reste à verser global. Cela vous permet de vérifier que le montant saisi est correct.",
      },
      {
        type: "p",
        text: "Si vous essayez de verser plus que le reste à verser, l'enregistrement est bloqué. L'application affiche un message expliquant qu'il n'y a rien à verser ou que le montant dépasse ce qui est dû.",
      },
      {
        type: "h3",
        text: "Comment se calcule le Reste à verser",
      },
      {
        type: "p",
        text: "Le reste à verser est la différence entre tout l'argent gagné depuis le début (chiffre d'affaires total), toutes les dépenses depuis le début, et tout ce qui a déjà été versé depuis le début. Ce chiffre ne dépend pas de la période affichée. Il représente toujours la situation réelle globale.",
      },
      {
        type: "links",
        links: [{ label: "Aller à la Trésorerie", href: "/tresorerie" }],
      },
    ],
  },
  {
    id: "modifier",
    title: "Modifier, annuler et restaurer",
    blocks: [
      {
        type: "p",
        text: "Toutes les saisies peuvent être modifiées ou annulées. Rien n'est effacé définitivement.",
      },
      {
        type: "p",
        text: "Pour agir sur une ligne, cliquez sur les trois points ⋯ à droite de la ligne dans le tableau.",
      },
      {
        type: "h3",
        text: "Modifier",
      },
      {
        type: "p",
        text: "Le formulaire s'ouvre avec les valeurs actuelles déjà remplies. Changez ce que vous voulez et enregistrez. L'ancienne version est conservée automatiquement. Vous pouvez la consulter ou la restaurer via Historique dans le même menu.",
      },
      {
        type: "h3",
        text: "Annuler une saisie",
      },
      {
        type: "p",
        text: "La saisie passe en statut Annulée. Elle n'est plus comptabilisée dans aucun calcul. Elle reste visible si vous filtrez le tableau sur Annulées. Vous pouvez la restaurer à tout moment.",
      },
      {
        type: "h3",
        text: "Restaurer une saisie annulée",
      },
      {
        type: "p",
        text: "Cliquez sur ⋯ → Restaurer. La saisie redevient active et est à nouveau comptabilisée.",
      },
      {
        type: "h3",
        text: "Voir les versions précédentes",
      },
      {
        type: "p",
        text: "Cliquez sur ⋯ → Historique. Vous voyez toutes les versions précédentes de cette saisie. Cliquez sur Restaurer cette version pour revenir à une ancienne valeur.",
      },
    ],
  },
  {
    id: "rapports",
    title: "Rapports",
    blocks: [
      {
        type: "p",
        text: "La page Rapports génère une synthèse complète de la période choisie.",
      },
      {
        type: "p",
        text: "En haut, choisissez la période avec le même sélecteur qu'ailleurs dans l'application.",
      },
      {
        type: "p",
        text: "Le rapport affiche :",
      },
      {
        type: "ul",
        items: [
          "Les KPI principaux : production, stocks, ventes, dépenses, profit, versements, reste à verser.",
          "Une synthèse financière avec les recettes, les dépenses et le résultat net.",
          "Un graphique d'activité.",
          "Quatre tableaux de détail : Production, Ventes, Dépenses, Trésorerie.",
        ],
      },
      {
        type: "p",
        text: "Les boutons disponibles :",
      },
      {
        type: "ul",
        items: [
          "Générer le rapport : enregistre un instantané du rapport actuel dans la liste Rapports récents.",
          "PDF : télécharge le rapport en PDF.",
          "Excel : télécharge un fichier tableur avec les chiffres.",
          "Imprimer : lance l'impression.",
        ],
      },
      {
        type: "p",
        text: "Les rapports générés apparaissent dans la liste Rapports récents en bas de page. Vous pouvez les rouvrir, les re-télécharger ou les supprimer. Quand vous ouvrez un rapport archivé, un bandeau vous indique que vous consultez un rapport passé. Cliquez sur Revenir au live pour retrouver la vue normale.",
      },
      {
        type: "links",
        links: [{ label: "Voir les Rapports", href: "/rapports" }],
      },
    ],
  },
  {
    id: "historique",
    title: "Historique",
    blocks: [
      {
        type: "p",
        text: "La page Historique est le journal de tout ce qui s'est passé dans l'application.",
      },
      {
        type: "p",
        text: "Chaque action est enregistrée : création, modification, annulation, restauration.",
      },
      {
        type: "p",
        text: "Le journal affiche pour chaque action : la date, le module concerné (Production, Vente, Dépense…), le type d'action et un résumé de ce qui a été fait.",
      },
      {
        type: "p",
        text: "Vous pouvez filtrer par module ou par type d'action pour retrouver rapidement ce que vous cherchez.",
      },
      {
        type: "p",
        text: "À droite, une frise chronologique montre les huit actions les plus récentes avec leur heure.",
      },
      {
        type: "links",
        links: [{ label: "Voir l'Historique", href: "/historique" }],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    blocks: [
      {
        type: "p",
        text: "La cloche en haut à droite affiche un chiffre quand vous avez des alertes non lues.",
      },
      {
        type: "p",
        text: "Cliquez dessus pour voir vos notifications dans un panneau. Deux onglets sont disponibles :",
      },
      {
        type: "ul",
        items: [
          "Récentes : toutes les alertes actives.",
          "Importantes : uniquement les alertes critiques qui demandent votre attention.",
        ],
      },
      {
        type: "p",
        text: "Les notifications que l'application peut vous envoyer :",
      },
      {
        type: "ul",
        items: [
          "Stock vente incohérent — Le stock au magasin est négatif, ce qui ne devrait pas arriver. Vérifiez vos transferts et vos ventes.",
          "Stock vente faible — Il reste très peu d'alvéoles au magasin. Le seuil se configure dans Paramètres.",
          "Stock ferme épuisé — Il n'y a plus d'alvéoles disponibles à la ferme pour un envoi au magasin.",
          "Transfert contesté — Un envoi entre la ferme et le magasin a été contesté. Il faut le régulariser.",
          "Versement supérieur au reçu — Une ligne de trésorerie a un montant versé supérieur au montant reçu. Vérifiez cette saisie.",
          "Pertes anormales — Les casses des 7 derniers jours dépassent le pourcentage maximum que vous avez configuré dans Paramètres.",
          "Reste à verser élevé — Le montant à remettre à la ferme a dépassé le seuil configuré dans Paramètres.",
          "Reste à verser — Il y a encore de l'argent à remettre à la ferme, mais le montant reste dans la limite normale.",
          "Trésorerie à jour — Tout l'argent dû a été versé. Rien ne manque.",
          "Pas de production aujourd'hui — Aucune production n'a été enregistrée pour la journée en cours.",
          "Pas de vente aujourd'hui — Aucune vente n'a été enregistrée pour la journée en cours.",
        ],
      },
      {
        type: "p",
        text: "Cliquez sur une notification pour aller directement à la page concernée. Une fois lue, la notification n'apparaît plus dans le compteur.",
      },
    ],
  },
  {
    id: "parametres",
    title: "Paramètres",
    blocks: [
      {
        type: "p",
        text: "Les Paramètres vous permettent de configurer l'application selon les réalités de votre ferme.",
      },
      {
        type: "h3",
        text: "Profil de la ferme",
      },
      {
        type: "p",
        text: "Renseignez le nom de votre ferme, la ville et le numéro de téléphone. Ces informations apparaissent sur vos rapports imprimés.",
      },
      {
        type: "h3",
        text: "Préférences opérationnelles",
      },
      {
        type: "ul",
        items: [
          "Prix moyen du plateau : le prix proposé par défaut à chaque nouvelle vente. Vous pouvez le changer à la saisie.",
          "Capacité d'un plateau : le nombre d'œufs par alvéole (casier). Cette valeur est utilisée partout dans l'application pour convertir entre œufs et alvéoles.",
        ],
      },
      {
        type: "h3",
        text: "Seuils et alertes",
      },
      {
        type: "p",
        text: "Configurez à partir de quel niveau l'application vous envoie une alerte :",
      },
      {
        type: "ul",
        items: [
          "Stock vente faible : en dessous de combien d'alvéoles au magasin vous recevez une alerte.",
          "Trésorerie en attente : au-dessus de quel montant le reste à verser déclenche une alerte élevée.",
          "Pertes hebdomadaires : au-dessus de quel pourcentage de casses sur 7 jours vous recevez une alerte.",
        ],
      },
      {
        type: "h3",
        text: "Listes métier",
      },
      {
        type: "p",
        text: "Deux listes à gérer :",
      },
      {
        type: "ul",
        items: [
          "Catégories de dépense : alimentation, salaires, transport, etc. Vous pouvez renommer les catégories existantes, en ajouter de nouvelles et désactiver celles que vous n'utilisez pas.",
          "Méthodes de paiement : espèces, Orange Money, MTN, virement, etc. Même fonctionnement que les catégories.",
        ],
      },
      {
        type: "p",
        text: "N'oubliez pas de cliquer sur Enregistrer dans chaque section avant de passer à une autre.",
      },
      {
        type: "links",
        links: [{ label: "Ouvrir les Paramètres", href: "/parametres" }],
      },
    ],
  },
];
