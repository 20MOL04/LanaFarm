/**
 * Helpers d'affichage du journal d'actions (`state.actions`).
 *
 * Source unique pour :
 *   - labels FR par module et par type
 *   - icônes Lucide associées
 *   - tonalité sémantique (success / warning / danger / info / accent)
 *   - libellé utilisateur (V1 mono-user, future-ready multi-user)
 *   - format temps relatif FR compact
 *
 * Utilisé à la fois par le module Historique et par RecentActivity (Dashboard).
 */

import {
  Ban,
  Box,
  CheckCircle2,
  Egg,
  Lock,
  LockOpen,
  PenLine,
  PlusCircle,
  Receipt,
  Repeat,
  RotateCcw,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { ActionLog, ActionType, Module } from "@/types/domain";

/* ===========================================================
   Tons sémantiques partagés
   =========================================================== */

export type ActionDisplayTone =
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

/* ===========================================================
   Méta-données par module
   =========================================================== */

export const MODULE_LABEL: Record<Module, string> = {
  production: "Production",
  vente: "Vente",
  depense: "Dépense",
  tresorerie: "Trésorerie",
  transfert: "Transfert",
  semaine: "Semaine",
};

export const MODULE_ICON: Record<Module, LucideIcon> = {
  production: Egg,
  vente: ShoppingCart,
  depense: Receipt,
  tresorerie: Wallet,
  transfert: Repeat,
  semaine: Box,
};

/* ===========================================================
   Méta-données par type d'action
   =========================================================== */

export const TYPE_LABEL: Record<ActionType, string> = {
  creation: "Création",
  modification: "Modification",
  annulation: "Annulation",
  restauration: "Restauration",
  validation: "Validation",
  reouverture: "Réouverture",
  archivage: "Archivage",
};

type TypeMeta = { icon: LucideIcon; tone: ActionDisplayTone };

export const TYPE_META: Record<ActionType, TypeMeta> = {
  creation: { icon: PlusCircle, tone: "accent" },
  modification: { icon: PenLine, tone: "info" },
  annulation: { icon: Ban, tone: "danger" },
  restauration: { icon: RotateCcw, tone: "info" },
  validation: { icon: CheckCircle2, tone: "success" },
  reouverture: { icon: LockOpen, tone: "warning" },
  archivage: { icon: Lock, tone: "warning" },
};

/* ===========================================================
   Classes utilitaires pour les badges/cercles d'icônes
   (mappées depuis le tone — réutilisent les tokens existants)
   =========================================================== */

export const TONE_BG_SOFT: Record<ActionDisplayTone, string> = {
  accent: "bg-accent-blue-soft text-accent-blue",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

/* ===========================================================
   Utilisateur (multi-user ready)
   =========================================================== */

/**
 * Renvoie un libellé utilisateur lisible — préfère le champ `utilisateur`
 * de l'`ActionLog` (V2 multi-user). V1 :
 *   - "Système" pour les actions issues du seed
 *   - "Opérateur" pour toutes les saisies manuelles
 */
export function getActionUserLabel(action: ActionLog): string {
  if (action.utilisateur && action.utilisateur.trim().length > 0) {
    return action.utilisateur;
  }
  if (action.cibleId === "seed") return "Système";
  return "Opérateur";
}

/* ===========================================================
   Format temps relatif FR compact
   =========================================================== */

export function formatRelativeTimeFR(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((now - t) / 1000));

  if (diffSec < 45) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.round(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.round(diffSec / 3600)} h`;
  const j = Math.round(diffSec / 86400);
  if (j < 7) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString("fr-GN", {
    day: "2-digit",
    month: "short",
  });
}

/**
 * Format date + heure absolue (utile dans la table principale).
 * Ex : "24 mai 2026 · 14:32"
 */
export function formatAbsoluteDateTimeFR(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-GN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("fr-GN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/**
 * Résumé court pour le dashboard — évite les descriptions techniques
 * (ex. message d'initialisation seed) et allège les libellés répétitifs.
 */
export function formatActionShortSummary(action: ActionLog): string {
  if (action.cibleId === "seed") {
    return "Données de démonstration chargées";
  }

  let d = action.description.trim();

  const rules: Array<[RegExp, string | ((m: RegExpMatchArray) => string)]> = [
    [/^Saisie production\s*:\s*/i, ""],
    [/^Saisie vente\s*:\s*/i, ""],
    [/^Saisie /i, ""],
    [/^Mise à jour de la saisie production\.?$/i, "Fiche production modifiée"],
    [/^Mise à jour de la saisie vente\.?$/i, "Fiche vente modifiée"],
    [/^Mise à jour de la dépense\.?$/i, "Dépense modifiée"],
    [/^Mise à jour trésorerie\.?$/i, "Trésorerie modifiée"],
    [
      /^Saisie production annulée \(soft-delete\)\.?$/i,
      "Saisie production annulée",
    ],
    [/^Saisie vente annulée \(soft-delete\)\.?$/i, "Saisie vente annulée"],
    [/^Dépense annulée \(soft-delete\)\.?$/i, "Dépense annulée"],
    [/^Saisie trésorerie annulée \(soft-delete\)\.?$/i, "Saisie trésorerie annulée"],
    [/^Saisie production restaurée\.?$/i, "Saisie production restaurée"],
    [/^Saisie vente restaurée\.?$/i, "Saisie vente restaurée"],
    [/^Dépense restaurée\.?$/i, "Dépense restaurée"],
    [/^Saisie trésorerie restaurée\.?$/i, "Saisie trésorerie restaurée"],
    [/^Transfert auto\s*:\s*/i, "Transfert magasin · "],
    [/^Semaine ([\w-]+) validée et verrouillée\.?$/i, "Semaine validée"],
    [/^Semaine ([\w-]+) ré-ouverte \(verrou retiré\)\.?$/i, "Semaine réouverte"],
  ];

  for (const [pattern, replacement] of rules) {
    const m = d.match(pattern);
    if (m) {
      d =
        typeof replacement === "function"
          ? replacement(m)
          : d.replace(pattern, replacement);
      break;
    }
  }

  d = d.replace(/\s*\(soft-delete\)\.?$/, "");
  if (d.endsWith(".")) d = d.slice(0, -1);

  if (d.length > 72) {
    return `${TYPE_LABEL[action.type]} · ${MODULE_LABEL[action.module]}`;
  }

  return d;
}
