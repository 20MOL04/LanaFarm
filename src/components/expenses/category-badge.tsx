"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/components/expenses/category-meta";
import { useFarmConfig } from "@/contexts/farm-store";
import { resolveCategorieLabel } from "@/lib/config-defaults";
import type { CategorieDepense } from "@/types/domain";

type Props = {
  /** ID de catégorie (slug ou UUID). */
  category: CategorieDepense;
  /** Affiche l'icône à gauche. */
  withIcon?: boolean;
};

/**
 * Badge unifié pour les catégories de dépenses.
 * Libellé depuis la config admin ; icône / ton depuis category-meta.
 */
export function CategoryBadge({ category, withIcon = true }: Props) {
  const config = useFarmConfig();
  const categories = config.listes.categoriesDepense;
  const label = resolveCategorieLabel(category, categories);
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      {withIcon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </Badge>
  );
}
