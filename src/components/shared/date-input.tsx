"use client";

import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

/**
 * Champ date compact sur mobile (évite débordement du calendrier natif).
 */
export function DateInput({ className, id, ...props }: DateInputProps) {
  return (
    <div className="relative min-w-0 w-full max-w-full">
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted sm:block"
      />
      <Input
        id={id}
        type="date"
        className={cn(
          "h-9 w-full min-w-0 max-w-full pl-3 tabular-nums sm:pl-9",
          "[&::-webkit-date-and-time-value]:min-w-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
