/**
 * Méta-données visuelles par méthode de paiement (trésorerie).
 * Icône / ton par id ; libellé affiché via resolveMethodeLabel + config.
 */

import {
  Banknote,
  Landmark,
  type LucideIcon,
  Smartphone,
  Wallet,
} from "lucide-react";

import { METHODES_TRESORERIE } from "@/types/domain";

export type MethodMeta = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: "accent" | "warning" | "info" | "danger" | "success" | "neutral";
};

const META_BY_ID: Record<string, Omit<MethodMeta, "id" | "label">> = {
  cash: { icon: Banknote, tone: "success" },
  virement: { icon: Landmark, tone: "info" },
  /** Legacy */
  banque: { icon: Landmark, tone: "info" },
  "orange-money": { icon: Smartphone, tone: "warning" },
  "mtn-money": { icon: Smartphone, tone: "accent" },
};

const FALLBACK_META: Omit<MethodMeta, "id" | "label"> = {
  icon: Wallet,
  tone: "neutral",
};

export const METHODS_META: MethodMeta[] = METHODES_TRESORERIE.map((m) => ({
  id: m.id,
  label: m.label,
  ...(META_BY_ID[m.id] ?? FALLBACK_META),
}));

function metaForId(id: string, label: string): MethodMeta {
  const base = META_BY_ID[id] ?? FALLBACK_META;
  return { id, label, ...base };
}

export function getMethodMeta(methodeId: string): MethodMeta {
  const trimmed = methodeId.trim();
  if (!trimmed) {
    return { id: "cash", label: "Espèces", icon: Wallet, tone: "neutral" };
  }

  const normalized = trimmed === "banque" ? "virement" : trimmed;

  const byRef = METHODS_META.find((m) => m.id === normalized);
  if (byRef) return byRef;

  if (META_BY_ID[normalized]) {
    const ref = METHODES_TRESORERIE.find((m) => m.id === normalized);
    return metaForId(normalized, ref?.label ?? trimmed);
  }

  return metaForId(normalized, trimmed);
}
