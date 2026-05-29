import type { GuideSection } from "@/lib/user-guide/types";

export const GUIDE_INTRO = {
  title: "Guide d'utilisation",
  subtitle:
    "Tout ce dont vous avez besoin pour utiliser LanaFarm au quotidien, expliqué simplement.",
  welcome: `Bienvenue dans LanaFarm.

Ce guide a été créé pour vous aider à comprendre et utiliser facilement l'application au quotidien.

Même si vous n'êtes pas habitué à la technologie, ce guide vous accompagne étape par étape. Vous pouvez le lire dans l'ordre, ou sauter directement à la partie qui vous intéresse grâce au sommaire à gauche.

Prenez votre temps. Vous ne pouvez pas « casser » l'application en explorant. En cas de doute, revenez ici.`,
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "menu",
    title: "Le menu principal",
    blocks: [
      {
        type: "p",
        text: "Le menu bleu à gauche est votre carte routière. Il reste visible sur ordinateur ; sur téléphone, ouvrez-le avec les trois petites barres en haut à gauche.",
      },
      {
        type: "h3",
        text: "Vue d'ensemble",
      },
      {
        type: "ul",
        items: [
          "Dashboard : la photo globale de la ferme sur la période choisie (chiffres, graphique, raccourcis).",
        ],
      },
      {
        type: "h3",
        text: "Opérations (le cœur du travail quotidien)",
      },
      {
        type: "ul",
        items: [
          "Production : ce que vous ramassez à la ferme et ce que vous envoyez vers la vente.",
          "Ventes : ce que vous vendez au magasin ou aux clients.",
          "Dépenses : l'argent que vous dépensez (alimentation, salaires, transport…).",
          "Trésorerie : l'argent que vous recevez et ce que vous versez à la ferme.",
        ],
      },
      {
        type: "h3",
        text: "Pilotage",
      },
      {
        type: "ul",
        items: [
          "Rapports : synthèse imprimable ou en PDF / Excel pour une période.",
          "Historique : journal de tout ce qui a été fait (ajouts, modifications, annulations).",
          "Paramètres : nom de la ferme, prix du casier, listes, alertes.",
          "Guide : cette page d'aide.",
        ],
      },
      {
        type: "p",
        text: "En bas du menu : « Se déconnecter » ferme votre session en toute sécurité.",
      },
      {
        type: "links",
        links: [
          { label: "Ouvrir le Dashboard", href: "/dashboard" },
          { label: "Voir la Production", href: "/production" },
        ],
      },
    ],
  },
  {
    id: "couleurs",
    title: "Comprendre les couleurs",
    blocks: [
      {
        type: "p",
        text: "Les couleurs vous aident à lire un chiffre ou une situation en un coup d'œil. Elles ne changent jamais le sens des montants : elles les rendent plus visibles.",
      },
      {
        type: "ul",
        items: [
          "Bleu : actions principales (bouton « Nouvelle saisie », élément sélectionné dans le menu).",
          "Vert : situation positive ou stock disponible.",
          "Orange / jaune : attention, montant en attente, stock bas, alerte modérée.",
          "Rouge : perte, casses, annulation, montant négatif ou problème à corriger.",
          "Gris / blanc : texte normal, cartes et fond d'écran.",
        ],
      },
      {
        type: "tip",
        title: "Bon réflexe",
        text: "Si une carte devient orange ou rouge, lisez le petit texte sous le chiffre ou ouvrez la cloche de notifications : un message vous dira souvent quoi faire.",
      },
    ],
  },
  {
    id: "boutons",
    title: "Comprendre les boutons",
    blocks: [
      {
        type: "ul",
        items: [
          "Bouton bleu plein : action importante (« Nouvelle saisie », « Enregistrer »).",
          "Bouton blanc avec bordure : action secondaire (« Envoyer en Vente », « Annuler », « Générer rapport »).",
          "Les trois points « ⋯ » sur une ligne : menu d'actions (modifier, annuler, restaurer, historique).",
          "La loupe / barre « Rechercher » en haut : retrouver un client, un jour, un montant (raccourci clavier : Ctrl + K sur ordinateur).",
          "Le calendrier en haut à droite : changer la période affichée partout dans l'application.",
          "La cloche : vos alertes et rappels (stock bas, reste à verser, etc.).",
        ],
      },
      {
        type: "warning",
        title: "Avant de quitter une fenêtre",
        text: "Si vous avez commencé à remplir un formulaire sans enregistrer, l'application peut vous demander confirmation avant de changer de page. C'est normal : elle protège votre saisie.",
      },
    ],
  },
  {
    id: "graphiques",
    title: "Comprendre les graphiques",
    blocks: [
      {
        type: "p",
        text: "Le graphique d'activité (surtout sur le Dashboard et dans les Rapports) montre l'évolution jour par jour sur la période choisie en haut.",
      },
      {
        type: "ul",
        items: [
          "Chaque jour est un point sur la courbe ou une barre selon l'écran.",
          "Passez la souris (ou touchez sur mobile) sur un point pour voir le détail du jour.",
          "Si la courbe monte : plus d'activité ce jour-là. Si elle descend : moins d'activité.",
          "Le graphique suit toujours la période du calendrier global : changez la date en haut si vous voulez voir un autre mois ou une autre semaine.",
        ],
      },
      {
        type: "links",
        links: [{ label: "Voir le graphique sur le Dashboard", href: "/dashboard" }],
      },
    ],
  },
  {
    id: "statistiques",
    title: "Comprendre les statistiques (cartes chiffres)",
    blocks: [
      {
        type: "p",
        text: "Les cartes en haut de chaque page résument l'essentiel. Le libellé indique de quoi il s'agit ; le gros chiffre est la valeur ; parfois « alvéoles » ou « GNF » précise l'unité.",
      },
      {
        type: "h3",
        text: "Mots fréquents",
      },
      {
        type: "ul",
        items: [
          "Alvéole / casier : unité pour compter les œufs (un plateau d'œufs).",
          "Stock ferme : œufs encore à la ferme, pas encore partis en vente.",
          "Stock vente : invendus au magasin à la fin de la période.",
          "Chiffre d'affaires : argent des ventes sur la période.",
          "Reste à verser : ce qu'il reste à remettre à la ferme après dépenses et versements.",
          "Profit : ce qui reste une fois les dépenses déduites (simplifié pour la lecture).",
          "Œufs cassés : pertes comptées à la ferme et/ou en vente.",
        ],
      },
      {
        type: "tip",
        text: "Les chiffres suivent la période du calendrier en haut. Si un chiffre vous surprend, vérifiez d'abord que vous êtes sur « Ce mois » ou la bonne semaine.",
      },
    ],
  },
  {
    id: "calendrier-recherche",
    title: "Calendrier, recherche et notifications",
    blocks: [
      {
        type: "h3",
        text: "Le calendrier (en haut à droite)",
      },
      {
        type: "ol",
        items: [
          "Cliquez sur la date affichée.",
          "Choisissez « Cette semaine », « Ce mois » ou « Personnalisé » avec une date de début et de fin.",
          "Toutes les pages (Dashboard, Production, Ventes…) se mettent à jour pour cette période.",
        ],
      },
      {
        type: "h3",
        text: "La recherche",
      },
      {
        type: "p",
        text: "Tapez un nom de client, un jour ou un montant. La liste des résultats vous envoie directement vers la bonne page. Sur ordinateur : Ctrl + K.",
      },
      {
        type: "h3",
        text: "La cloche (notifications)",
      },
      {
        type: "ul",
        items: [
          "Le petit chiffre rouge indique des messages non lus.",
          "Cliquez sur une alerte pour la lire.",
          "Les alertes rappellent par exemple un stock bas ou un reste à verser important.",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Tableau de bord (Dashboard)",
    blocks: [
      {
        type: "p",
        text: "C'est votre tableau de bord : tout en un coup d'œil pour la période choisie.",
      },
      {
        type: "h3",
        text: "Ce que vous voyez",
      },
      {
        type: "ul",
        items: [
          "Des cartes : stock ferme, stock vente, chiffre d'affaires, profit, montant versé, reste à verser, dépenses, casses…",
          "Un graphique d'activité sur la période.",
          "Des raccourcis rapides (ajouter production, vente, etc.).",
          "L'activité récente : dernières actions enregistrées.",
        ],
      },
      {
        type: "h3",
        text: "Boutons utiles",
      },
      {
        type: "ul",
        items: [
          "« Générer rapport » : ouvre la page Rapports.",
          "« Nouvelle saisie » : ouvre directement le formulaire Production.",
        ],
      },
      {
        type: "h3",
        text: "Conseil",
      },
      {
        type: "tip",
        text: "Commencez votre journée ici : vérifiez le reste à verser et le stock, puis allez saisir dans Production ou Ventes.",
      },
      {
        type: "links",
        links: [
          { label: "Ouvrir le Dashboard", href: "/dashboard" },
          { label: "Nouvelle production", href: "/production?action=ajouter" },
        ],
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    blocks: [
      {
        type: "p",
        text: "Ici vous notez ce qui se passe à la ferme : combien d'œufs ramassés, combien cassés, combien envoyés vers la vente.",
      },
      {
        type: "h3",
        text: "Les cartes en haut",
      },
      {
        type: "ul",
        items: [
          "Alvéoles ramassées : total ramassé sur la période.",
          "Alvéoles mises en vente : ce qui est parti vers le magasin.",
          "Stock ferme : ce qui reste encore à la ferme.",
          "Œufs cassés : pertes à la ferme sur la période.",
        ],
      },
      {
        type: "h3",
        text: "Ajouter une saisie",
      },
      {
        type: "ol",
        items: [
          "Cliquez sur « Nouvelle saisie » (bouton bleu).",
          "Choisissez le jour.",
          "Indiquez les quantités (ramassées, cassées, mises en vente).",
          "Validez avec « Enregistrer ».",
        ],
      },
      {
        type: "p",
        text: "Une seule saisie active par jour : si le jour existe déjà, utilisez « Modifier » sur la ligne au lieu d'en créer une nouvelle.",
      },
      {
        type: "h3",
        text: "Envoyer en vente",
      },
      {
        type: "p",
        text: "Le bouton « Envoyer en Vente » sert à enregistrer un envoi vers le magasin (même logique que les mises en vente dans la saisie du jour).",
      },
      {
        type: "h3",
        text: "Modifier, annuler, restaurer",
      },
      {
        type: "ul",
        items: [
          "Les trois points « ⋯ » sur une ligne : Modifier, Annuler, Restaurer, Historique.",
          "Annuler : la ligne reste visible mais n'est plus comptée (filtre « Annulées »).",
          "Restaurer : remettre une ligne annulée.",
        ],
      },
      {
        type: "warning",
        title: "Erreurs fréquentes",
        text: "Oublier de changer la période en haut ; créer deux fois le même jour au lieu de modifier ; vendre plus que le stock disponible.",
      },
      {
        type: "links",
        links: [
          { label: "Voir la Production", href: "/production" },
          { label: "Nouvelle saisie", href: "/production?action=ajouter" },
        ],
      },
    ],
  },
  {
    id: "ventes",
    title: "Ventes",
    blocks: [
      {
        type: "p",
        text: "Vous enregistrez ici ce qui est vendu : quantité, prix du casier, client éventuel, casses en vente.",
      },
      {
        type: "h3",
        text: "Les cartes en haut",
      },
      {
        type: "ul",
        items: [
          "Stock vente : invendus au magasin.",
          "Alvéoles vendues : total vendu sur la période.",
          "Chiffre d'affaires : argent des ventes.",
          "Reste à verser : ce qu'il reste à remettre à la ferme.",
        ],
      },
      {
        type: "h3",
        text: "Ajouter une vente",
      },
      {
        type: "ol",
        items: [
          "« Nouvelle saisie » ou « Ajouter ».",
          "Choisissez un jour ou plusieurs jours (mode plusieurs jours).",
          "Renseignez vendus, prix, client si besoin.",
          "Enregistrez.",
        ],
      },
      {
        type: "p",
        text: "L'application calcule automatiquement le montant et le « reçu ferme » à partir de la production et des ventes déjà saisies.",
      },
      {
        type: "h3",
        text: "Stock insuffisant",
      },
      {
        type: "warning",
        text: "Si vous vendez plus que le stock disponible au magasin, un message vous prévient. Vérifiez la Production (envois) et les ventes déjà enregistrées.",
      },
      {
        type: "links",
        links: [
          { label: "Aller dans les Ventes", href: "/ventes" },
          { label: "Ajouter une vente", href: "/ventes?action=ajouter" },
        ],
      },
    ],
  },
  {
    id: "depenses",
    title: "Dépenses",
    blocks: [
      {
        type: "p",
        text: "Toutes les sorties d'argent : alimentation, salaires, transport, emballage, etc.",
      },
      {
        type: "h3",
        text: "Ajouter une dépense",
      },
      {
        type: "ol",
        items: [
          "« Nouvelle saisie ».",
          "Jour, catégorie, montant en GNF, description optionnelle.",
          "Enregistrer.",
        ],
      },
      {
        type: "p",
        text: "Les catégories se gèrent dans Paramètres → Listes métier si vous devez en ajouter une.",
      },
      {
        type: "h3",
        text: "Après validation",
      },
      {
        type: "p",
        text: "La dépense apparaît dans le tableau, entre dans le total des dépenses et influence le profit et le reste à verser sur le Dashboard.",
      },
      {
        type: "links",
        links: [
          { label: "Voir les Dépenses", href: "/depenses" },
          { label: "Ajouter une dépense", href: "/depenses?action=ajouter" },
        ],
      },
    ],
  },
  {
    id: "tresorerie",
    title: "Trésorerie",
    blocks: [
      {
        type: "p",
        text: "Vous notez l'argent réellement reçu (espèces, Orange Money, MTN, virement…) et ce que vous déposez pour la ferme.",
      },
      {
        type: "h3",
        text: "Les cartes en haut",
      },
      {
        type: "ul",
        items: [
          "Total reçu : somme encaissée sur la période.",
          "Montant versé : ce qui a été remis à la ferme.",
          "Reste à verser : écart encore dû (lié aux ventes et dépenses).",
        ],
      },
      {
        type: "h3",
        text: "Saisie",
      },
      {
        type: "ol",
        items: [
          "« Nouvelle saisie ».",
          "Jour, méthode de paiement, montant reçu, montant déposé si partiel.",
          "Enregistrer.",
        ],
      },
      {
        type: "tip",
        text: "Saisissez la trésorerie régulièrement : le « reste à verser » sur le Dashboard sera plus fiable.",
      },
      {
        type: "links",
        links: [
          { label: "Ouvrir la Trésorerie", href: "/tresorerie" },
          { label: "Nouvelle saisie trésorerie", href: "/tresorerie?action=ajouter" },
        ],
      },
    ],
  },
  {
    id: "rapports",
    title: "Rapports",
    blocks: [
      {
        type: "p",
        text: "Pour imprimer ou exporter une synthèse de la période (PDF, Excel) ou archiver un rapport.",
      },
      {
        type: "h3",
        text: "Étapes",
      },
      {
        type: "ol",
        items: [
          "Choisissez la période (Cette semaine, Ce mois, Personnalisé) — même calendrier qu'en haut.",
          "« Générer et archiver » : sauvegarde le rapport dans la liste en bas.",
          "« Imprimer », « PDF » ou « Excel » : obtenir le document.",
        ],
      },
      {
        type: "p",
        text: "Les chiffres du rapport reprennent exactement ceux des saisies sur la période.",
      },
      {
        type: "links",
        links: [
          { label: "Ouvrir les Rapports", href: "/rapports" },
          { label: "Générer un rapport", href: "/rapports?action=generer" },
        ],
      },
    ],
  },
  {
    id: "historique",
    title: "Historique",
    blocks: [
      {
        type: "p",
        text: "Journal de tout ce qui s'est passé : créations, modifications, annulations, restaurations. Utile pour retrouver « qui a changé quoi ».",
      },
      {
        type: "ul",
        items: [
          "Filtres par type d'action et par zone (production, vente…).",
          "Recherche dans le journal.",
          "Frise chronologique à droite sur grand écran.",
        ],
      },
      {
        type: "links",
        links: [{ label: "Voir l'Historique", href: "/historique" }],
      },
    ],
  },
  {
    id: "parametres",
    title: "Paramètres",
    blocks: [
      {
        type: "p",
        text: "Configuration de la ferme. À remplir une fois, puis à ajuster si les prix ou les listes changent.",
      },
      {
        type: "ul",
        items: [
          "Profil : nom, ville, téléphone de la ferme.",
          "Préférences : prix du casier (GNF), taille du plateau (œufs par alvéole).",
          "Seuils & alertes : quand l'application vous prévient (stock bas, reste à verser…).",
          "Listes métier : catégories de dépenses, méthodes de paiement.",
        ],
      },
      {
        type: "p",
        text: "N'oubliez pas « Enregistrer » dans chaque section avant de changer d'onglet à gauche.",
      },
      {
        type: "links",
        links: [{ label: "Ouvrir les Paramètres", href: "/parametres" }],
      },
    ],
  },
  {
    id: "conseils-finaux",
    title: "Conseils pour bien utiliser LanaFarm",
    blocks: [
      {
        type: "ol",
        items: [
          "Chaque matin : vérifiez la période (calendrier), puis le Dashboard.",
          "Saisissez Production le jour même.",
          "Enregistrez les Ventes et la Trésorerie souvent — les totaux seront justes.",
          "Consultez la cloche si un chiffre vous semble bizarre.",
          "Une fois par semaine ou par mois : générez un Rapport pour garder une trace.",
        ],
      },
      {
        type: "tip",
        title: "Vous n'êtes pas seul",
        text: "Ce guide reste accessible depuis le menu « Guide ». Revenez-y quand vous voulez : il ne disparaît pas.",
      },
      {
        type: "links",
        links: [
          { label: "Commencer par le Dashboard", href: "/dashboard" },
          { label: "Guide — Production", href: "/production" },
        ],
      },
    ],
  },
];
