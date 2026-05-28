"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  onAdd: () => void;
};

export function DialogDayLinesToolbar({ label, onAdd }: Props) {
  return (
    <div className="flex w-max items-center gap-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Ajouter
      </Button>
    </div>
  );
}
