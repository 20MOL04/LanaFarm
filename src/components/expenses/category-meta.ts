/**
 * Méta-données visuelles par catégorie de dépense.
 * Résolution par label stocké, id technique ou slug legacy.
 */

import {
  Box,
  HardHat,
  HeartPulse,
  type LucideIcon,
  Receipt,
  ShoppingBasket,
  Sparkles,
  Truck,
  Wheat,
  Wrench,
} from "lucide-react";

import { CATEGORIES_DEPENSES } from "@/types/domain";

export type CategoryMeta = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: "accent" | "warning" | "info" | "danger" | "success" | "neutral";
};

const META_BY_ID: Record<string, Omit<CategoryMeta, "id" | "label">> = {
  alimentation: { icon: Wheat, tone: "warning" },
  "main-d-oeuvre": { icon: HardHat, tone: "danger" },
  transport: { icon: Truck, tone: "info" },
  emballage: { icon: Box, tone: "accent" },
  sante: { icon: HeartPulse, tone: "success" },
  infrastructure: { icon: Wrench, tone: "neutral" },
  divers: { icon: Sparkles, tone: "neutral" },
  /** Slugs legacy (seed / données anciennes). */
  aliments: { icon: Wheat, tone: "warning" },
};

const FALLBACK_META: Omit<CategoryMeta, "id" | "label"> = {
  icon: Receipt,
  tone: "neutral",
};

/** Référentiel visuel des 7 catégories de base. */
export const CATEGORIES_META: CategoryMeta[] = CATEGORIES_DEPENSES.map((c) => ({
  id: c.id,
  label: c.label,
  ...(META_BY_ID[c.id] ?? FALLBACK_META),
}));

function metaForId(id: string, label: string): CategoryMeta {
  const base = META_BY_ID[id] ?? FALLBACK_META;
  return { id, label, ...base };
}

/**
 * Résout icône / ton à partir de la valeur stockée sur Depense.categorie
 * (libellé libre, id ou slug legacy).
 */
export function getCategoryMeta(categorie: string): CategoryMeta {
  const trimmed = categorie.trim();
  if (!trimmed) {
    return { id: "divers", label: "Divers", icon: ShoppingBasket, tone: "neutral" };
  }

  const byRefId = CATEGORIES_META.find((c) => c.id === trimmed);
  if (byRefId) return byRefId;

  const byRefLabel = CATEGORIES_META.find(
    (c) => c.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (byRefLabel) return { ...byRefLabel, label: trimmed };

  if (META_BY_ID[trimmed]) {
    const ref = CATEGORIES_DEPENSES.find((c) => c.id === trimmed);
    return metaForId(trimmed, ref?.label ?? trimmed);
  }

  return { id: trimmed, label: trimmed, ...FALLBACK_META };
}
