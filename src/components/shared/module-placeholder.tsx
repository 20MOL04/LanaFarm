import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Column = { key: string; label: string; align?: "left" | "right" | "center" };

type ModulePlaceholderProps = {
  title: string;
  description: string;
  columns: Column[];
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: LucideIcon;
  primaryActionLabel: string;
  primaryActionHref?: string;
};

/**
 * Squelette commun aux modules en attente de saisie réelle.
 * Reproduit la structure cible : header + (futur) KPI + tableau + état vide.
 */
export function ModulePlaceholder({
  columns,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  primaryActionLabel,
}: ModulePlaceholderProps) {
  return (
    <SectionCard>
      <SectionHeader
        title="Tableau"
        actions={
          <Button variant="accent" disabled>
            {primaryActionLabel}
          </Button>
        }
      />
      <SectionBody>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-card-muted/40">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-muted",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      (!col.align || col.align === "left") && "text-left"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="outline" disabled>
              {primaryActionLabel}
            </Button>
          }
        />
      </SectionBody>
    </SectionCard>
  );
}
