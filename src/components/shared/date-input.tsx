"use client";

import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /** Largeur réduite pour dialogues (défaut : true). */
  compact?: boolean;
};

/**
 * Champ date compact dans les dialogues.
 */
export function DateInput({
  className,
  id,
  compact = true,
  ...props
}: DateInputProps) {
  return (
    <div
      className={cn(
        "relative min-w-0",
        compact ? "w-full max-w-[10.5rem]" : "w-full max-w-full"
      )}
    >
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute left-2 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-muted sm:block"
      />
      <Input
        id={id}
        type="date"
        className={cn(
          "h-8 w-full min-w-0 max-w-full pl-2.5 text-base tabular-nums sm:pl-8 md:text-[13px]",
          "[&::-webkit-date-and-time-value]:min-w-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
