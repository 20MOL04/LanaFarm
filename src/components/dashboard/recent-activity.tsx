"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";

import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { useFarmState_unsafe } from "@/contexts/farm-store";
import {
  MODULE_LABEL,
  TYPE_META,
  formatActionShortSummary,
  formatRelativeTimeFR,
} from "@/lib/action-display";
import { accentIconClass } from "@/lib/display-tokens";
import { cn } from "@/lib/utils";
import type { ActionLog } from "@/types/domain";

/**
 * Flux d'activité unifié — alimenté par `state.actions` (journal central).
 */
export function RecentActivity({ limit = 4 }: { limit?: number }) {
  const state = useFarmState_unsafe();

  const items = React.useMemo(
    () => state.actions.slice(0, limit),
    [state.actions, limit]
  );

  return (
    <SectionCard className="h-fit w-full">
      <SectionHeader
        compact
        title="Activité récente"
        actions={
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link href="/historique">
              Tout voir
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />
      <SectionBody compact>
        {items.length === 0 ? (
          <p className="text-xs text-muted">
            Les saisies et validations apparaîtront ici.
          </p>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {items.map((a) => (
              <ActivityRow key={a.id} action={a} />
            ))}
          </ul>
        )}
      </SectionBody>
    </SectionCard>
  );
}

function ActivityRow({ action }: { action: ActionLog }) {
  const typeMeta = TYPE_META[action.type];
  const Icon = typeMeta.icon;
  const summary = formatActionShortSummary(action);

  return (
    <li className="flex items-start gap-2 py-1.5">
      <span
        className={cn(
          "flex h-6 w-6 flex-none items-center justify-center rounded-sm",
          typeMeta.tone === "accent" && accentIconClass,
          typeMeta.tone === "success" && "text-success",
          typeMeta.tone === "warning" && "text-warning",
          typeMeta.tone === "danger" && "text-danger",
          typeMeta.tone === "info" && accentIconClass
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-medium text-foreground">
            {MODULE_LABEL[action.module]}
          </p>
          <span className="shrink-0 text-[11px] text-muted">
            {formatRelativeTimeFR(action.dateISO)}
          </span>
        </div>
        <p className="line-clamp-1 text-[11px] text-muted">{summary}</p>
      </div>
    </li>
  );
}
