"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  isDirty: boolean;
  onSave: () => void;
  onReset: () => void;
};

/**
 * Barre d'action en bas de chaque section éditable.
 * Visible uniquement si le draft est dirty.
 */
export function SectionSaveBar({ isDirty, onSave, onReset }: Props) {
  if (!isDirty) return null;
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
      <p className="mr-auto text-xs text-muted">Modifications non enregistrées</p>
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        Annuler
      </Button>
      <Button type="button" variant="accent" size="sm" onClick={onSave}>
        <Check className="h-4 w-4" />
        Enregistrer
      </Button>
    </div>
  );
}
