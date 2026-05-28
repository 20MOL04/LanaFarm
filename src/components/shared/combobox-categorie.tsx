"use client";

import { ComboboxConfig } from "@/components/shared/combobox-config";
import { useConfigStore } from "@/contexts/farm-store";
import {
  getCategorieConfigLabel,
  resolveCategorieLabel,
} from "@/lib/config-defaults";
import type { ConfigCategorieDepenseItem } from "@/types/domain";

type Props = {
  id?: string;
  value: string;
  onChange: (categorieId: string) => void;
  categories: ConfigCategorieDepenseItem[];
  placeholder?: string;
};

export function ComboboxCategorie({
  id = "categorie-combobox",
  value,
  onChange,
  categories,
  placeholder = "Ex : Santé / Vétérinaire",
}: Props) {
  const { addCategorie, storeError, clearStoreError } = useConfigStore();

  const items = categories.map((c) => ({
    id: c.id,
    label: getCategorieConfigLabel(c),
    actif: c.actif,
  }));

  return (
    <ComboboxConfig
      id={id}
      value={value}
      onChange={onChange}
      items={items}
      resolveLabel={(id, items) =>
        resolveCategorieLabel(
          id,
          categories
        )
      }
      placeholder={placeholder}
      onCreate={addCategorie}
      createError={
        storeError?.code === "CATEGORIE_EXISTE" ? storeError.message : null
      }
      onClearError={clearStoreError}
      duplicateErrorCode="CATEGORIE_EXISTE"
    />
  );
}
