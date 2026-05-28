import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatène et déduplique des classes Tailwind.
 * Usage : <div className={cn("p-4", isActive && "bg-card")} />
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
