import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EntreeStatut } from "@/types/domain";

type EntryStatusBadgeLabels = {
  annule: string;
  archive: string;
};

const DEFAULT_LABELS: EntryStatusBadgeLabels = {
  annule: "Annulée",
  archive: "Archivée",
};

const MASCULINE_LABELS: EntryStatusBadgeLabels = {
  annule: "Annulé",
  archive: "Archivé",
};

type Props = {
  statut: EntreeStatut;
  size?: "sm" | "default";
  /** Libellés au masculin (ex. trésorerie). */
  masculine?: boolean;
};

/**
 * Badge de statut d'une entrée métier (actif → rien affiché).
 */
export function EntryStatusBadge({
  statut,
  size = "default",
  masculine = false,
}: Props) {
  const labels = masculine ? MASCULINE_LABELS : DEFAULT_LABELS;
  const sizeClass = size === "sm" ? "text-[10px]" : undefined;

  if (statut === "annule") {
    return (
      <Badge tone="danger" className={cn(sizeClass)}>
        {labels.annule}
      </Badge>
    );
  }
  if (statut === "archive") {
    return (
      <Badge tone="outline" className={cn(sizeClass)}>
        {labels.archive}
      </Badge>
    );
  }
  return null;
}
