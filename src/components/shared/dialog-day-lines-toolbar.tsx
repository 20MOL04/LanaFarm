"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  onAdd?: () => void;
};

export function DialogDayLinesToolbar({ label, onAdd }: Props) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      {onAdd ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      ) : null}
    </div>
  );
}
