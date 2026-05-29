import { cn } from "@/lib/utils";

/** Bouton segmenté sélectionné (filtres Activité, Rapports, etc.). */
export const segmentActiveClass =
  "bg-accent-blue !text-white shadow-sm hover:bg-accent-blue [&>svg]:!text-white" as const;

/** Bouton segmenté inactif. */
export const segmentInactiveClass =
  "text-muted hover:bg-card hover:text-foreground" as const;

export function segmentToggleClass(active: boolean, extra?: string) {
  return cn(
    "h-7 px-3 text-label font-semibold",
    active ? segmentActiveClass : segmentInactiveClass,
    extra
  );
}
