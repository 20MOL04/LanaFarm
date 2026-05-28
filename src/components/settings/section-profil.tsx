"use client";

import { Building2 } from "lucide-react";

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

export function SectionProfil() {
  const { config, updateProfil } = useConfigStore();
  const { draft, setField, isDirty, reset } = useSectionForm(config.profil);
  useRegisterUnsavedChanges(isDirty);

  return (
    <SectionCard>
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted" />
            Profil de la ferme
          </span>
        }
      />
      <SectionBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nom de la ferme" htmlFor="profil-nom" required>
            <Input
              id="profil-nom"
              value={draft.nom}
              onChange={(e) => setField("nom", e.target.value)}
              placeholder="LanaFarm"
            />
          </FormField>
          <FormField label="Ville" htmlFor="profil-ville">
            <Input
              id="profil-ville"
              value={draft.ville}
              onChange={(e) => setField("ville", e.target.value)}
              placeholder="Conakry"
            />
          </FormField>
          <FormField label="Téléphone" htmlFor="profil-tel">
            <Input
              id="profil-tel"
              value={draft.telephone}
              onChange={(e) => setField("telephone", e.target.value)}
              placeholder="+224 000 00 00 00"
              inputMode="tel"
            />
          </FormField>
        </div>

        <SectionSaveBar
          isDirty={isDirty}
          onSave={() => updateProfil(draft)}
          onReset={reset}
        />
      </SectionBody>
    </SectionCard>
  );
}
