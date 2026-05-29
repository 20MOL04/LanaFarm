"use client";

import { CalendarRange, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  multiMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function MultiDayModeToggle({ multiMode, onToggle, disabled }: Props) {
  return (
    <Button
      type="button"
      variant={multiMode ? "primary" : "ghost"}
      size="sm"
      className="h-8 gap-1.5 text-label"
      onClick={onToggle}
      disabled={disabled}
    >
      {multiMode ? (
        <>
          <X className="h-3.5 w-3.5" />
          1 jour
        </>
      ) : (
        <>
          <CalendarRange className="h-3.5 w-3.5" />
          Plusieurs jours
        </>
      )}
    </Button>
  );
}
