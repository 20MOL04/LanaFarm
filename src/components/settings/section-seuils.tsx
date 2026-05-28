"use client";

import { AlertTriangle } from "lucide-react";

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

export function SectionSeuils() {
  const { config, updateSeuils } = useConfigStore();
  const { draft, setField, isDirty, reset } = useSectionForm(config.seuils);
  useRegisterUnsavedChanges(isDirty);

  return (
    <SectionCard>
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted" />
            Seuils & alertes
          </span>
        }
      />
      <SectionBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Stock vente faible"
            htmlFor="seuil-stock"
            hint="En nombre de plateaux. Déclenche un insight quand le stock descend en dessous."
            required
          >
            <Input
              id="seuil-stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={Number.isFinite(draft.stockMagasinFaiblePlateaux) ? draft.stockMagasinFaiblePlateaux : 0}
              onChange={(e) =>
                setField(
                  "stockMagasinFaiblePlateaux",
                  Math.max(0, Math.floor(e.target.valueAsNumber || 0))
                )
              }
              className="tabular-nums"
            />
          </FormField>
          <FormField
            label="Trésorerie en attente maximale"
            htmlFor="seuil-tresorerie"
            hint="En GNF. Au-dessus, le Dashboard alerte qu'il faut déposer."
            required
          >
            <Input
              id="seuil-tresorerie"
              type="number"
              inputMode="numeric"
              min={0}
              step={50_000}
              value={Number.isFinite(draft.tresorerieEnAttenteMaxGNF) ? draft.tresorerieEnAttenteMaxGNF : 0}
              onChange={(e) =>
                setField(
                  "tresorerieEnAttenteMaxGNF",
                  Math.max(0, Math.floor(e.target.valueAsNumber || 0))
                )
              }
              className="tabular-nums"
            />
          </FormField>
          <FormField
            label="Pertes hebdomadaires maximales"
            htmlFor="seuil-pertes"
            hint="En % de la production. Au-dessus, le Dashboard signale une dérive."
            required
          >
            <Input
              id="seuil-pertes"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              value={Number.isFinite(draft.pertesHebdoMaxPct) ? draft.pertesHebdoMaxPct : 0}
              onChange={(e) =>
                setField(
                  "pertesHebdoMaxPct",
                  Math.max(0, Math.min(100, e.target.valueAsNumber || 0))
                )
              }
              className="tabular-nums"
            />
          </FormField>
        </div>

        <SectionSaveBar
          isDirty={isDirty}
          onSave={() => updateSeuils(draft)}
          onReset={reset}
        />
      </SectionBody>
    </SectionCard>
  );
}
