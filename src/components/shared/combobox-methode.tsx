"use client";

import { ComboboxConfig } from "@/components/shared/combobox-config";
import { useConfigStore } from "@/contexts/farm-store";
import {
  getMethodeConfigLabel,
  resolveMethodeLabel,
} from "@/lib/config-defaults";
import type { ConfigMethodePaiementItem } from "@/types/domain";

type Props = {
  id?: string;
  value: string;
  onChange: (methodeId: string) => void;
  methodes: ConfigMethodePaiementItem[];
  placeholder?: string;
};

export function ComboboxMethode({
  id = "methode-combobox",
  value,
  onChange,
  methodes,
  placeholder = "Ex : Orange Money",
}: Props) {
  const { addMethode, storeError, clearStoreError } = useConfigStore();

  const items = methodes.map((m) => ({
    id: m.id,
    label: getMethodeConfigLabel(m),
    actif: m.actif,
  }));

  return (
    <ComboboxConfig
      id={id}
      value={value}
      onChange={onChange}
      items={items}
      resolveLabel={(id) =>
        resolveMethodeLabel(id, methodes)
      }
      placeholder={placeholder}
      onCreate={addMethode}
      createError={
        storeError?.code === "METHODE_EXISTE" ? storeError.message : null
      }
      onClearError={clearStoreError}
      duplicateErrorCode="METHODE_EXISTE"
    />
  );
}
