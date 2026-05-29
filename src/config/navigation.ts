/**
 * Navigation principale de l'application.
 * Les icônes sont des composants `lucide-react` rendus par la sidebar.
 */

import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Egg,
  History,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Affiché en petit, sous le label, dans certains contextes. */
  description?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Vue globale de la ferme",
      },
    ],
  },
  {
    title: "Opérations",
    items: [
      {
        label: "Production",
        href: "/production",
        icon: Egg,
        description: "Alvéoles ramassées & reste ferme",
      },
      {
        label: "Ventes",
        href: "/ventes",
        icon: ShoppingCart,
        description: "Ventes & stock vente",
      },
      {
        label: "Dépenses",
        href: "/depenses",
        icon: Receipt,
        description: "Charges de la ferme",
      },
      {
        label: "Trésorerie",
        href: "/tresorerie",
        icon: Wallet,
        description: "Encaissements et versements",
      },
    ],
  },
  {
    title: "Pilotage",
    items: [
      {
        label: "Rapports",
        href: "/rapports",
        icon: BarChart3,
        description: "Synthèses & exports PDF",
      },
      {
        label: "Historique",
        href: "/historique",
        icon: History,
        description: "Semaines passées",
      },
      {
        label: "Paramètres",
        href: "/parametres",
        icon: Settings,
      },
    ],
  },
];

/** Section séparée en bas du menu — au-dessus de « Se déconnecter ». */
export const assistanceNavigation: NavGroup = {
  title: "Assistance",
  items: [
    {
      label: "Guide d'utilisation",
      href: "/guide",
      icon: BookOpen,
      description: "Aide pas à pas pour utiliser l'application",
    },
  ],
};

export const quickActions: NavItem[] = [
  { label: "Ajouter production", href: "/production?action=ajouter", icon: Egg },
  { label: "Ajouter vente", href: "/ventes?action=ajouter", icon: ShoppingCart },
  { label: "Ajouter dépense", href: "/depenses?action=ajouter", icon: Receipt },
  { label: "Saisie trésorerie", href: "/tresorerie?action=ajouter", icon: Wallet },
  { label: "Générer rapport", href: "/rapports?action=generer", icon: ClipboardList },
];
