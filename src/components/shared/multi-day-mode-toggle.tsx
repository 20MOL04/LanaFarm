"use client";

import { CalendarRange, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { segmentToggleClass } from "@/lib/segment-toggle-styles";

type Props = {
  multiMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function MultiDayModeToggle({ multiMode, onToggle, disabled }: Props) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={segmentToggleClass(multiMode, "h-8 gap-1.5")}
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
