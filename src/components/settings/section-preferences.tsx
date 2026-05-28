"use client";

import { Settings2 } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { SectionSaveBar } from "@/components/settings/section-save-bar";
import { useSectionForm } from "@/components/settings/use-section-form";
import { useRegisterUnsavedChanges } from "@/hooks/use-register-unsaved-changes";
import { Input } from "@/components/ui/input";
import { useConfigStore } from "@/contexts/farm-store";

export function SectionPreferences() {
  const { config, updatePreferences } = useConfigStore();
  const { draft, setField, isDirty, reset } = useSectionForm(config.preferences);
  useRegisterUnsavedChanges(isDirty);

  return (
    <SectionCard>
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted" />
            Préférences opérationnelles
          </span>
        }
      />
      <SectionBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Prix moyen du plateau (GNF)"
            htmlFor="pref-prix"
            hint="Prix affiché en premier lors d'une nouvelle vente."
            required
          >
            <Input
              id="pref-prix"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={Number.isFinite(draft.prixPlateauGNF) ? draft.prixPlateauGNF : 0}
              onChange={(e) =>
                setField(
                  "prixPlateauGNF",
                  Math.max(0, Math.floor(e.target.valueAsNumber || 0))
                )
              }
              className="tabular-nums"
            />
          </FormField>
          <FormField
            label="Capacité d'un plateau"
            htmlFor="pref-capacite"
            hint="Nombre d'œufs par plateau (alvéoles)."
            required
          >
            <Input
              id="pref-capacite"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={Number.isFinite(draft.capacitePlateau) ? draft.capacitePlateau : 30}
              onChange={(e) =>
                setField(
                  "capacitePlateau",
                  Math.max(1, Math.floor(e.target.valueAsNumber || 30))
                )
              }
              className="tabular-nums"
            />
          </FormField>
        </div>

        <SectionSaveBar
          isDirty={isDirty}
          onSave={() => updatePreferences(draft)}
          onReset={reset}
        />
      </SectionBody>
    </SectionCard>
  );
}
