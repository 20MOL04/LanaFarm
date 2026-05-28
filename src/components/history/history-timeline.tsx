"use client";

import { Clock } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import {
  MODULE_ICON,
  MODULE_LABEL,
  TONE_BG_SOFT,
  TYPE_META,
  formatRelativeTimeFR,
  getActionUserLabel,
} from "@/lib/action-display";
import { cn } from "@/lib/utils";
import type { ActionLog } from "@/types/domain";

type Props = {
  actions: ActionLog[];
  limit?: number;
};

/**
 * Vue compacte des actions les plus récentes — pour visibilité opérationnelle
 * immédiate dans le module Historique. Le tri suppose `state.actions` déjà
 * trié décroissant par date (le reducer `pushLog` prepend).
 */
export function HistoryTimeline({ actions, limit = 8 }: Props) {
  const items = actions.slice(0, limit);

  return (
    <SectionCard>
      <SectionHeader title="Timeline" />
      <SectionBody>
        {items.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Aucune activité récente"
            description="Les actions apparaîtront ici en temps réel."
          />
        ) : (
          <ol
            role="list"
            className="relative space-y-3 border-l border-border pl-5"
          >
            {items.map((a) => (
              <TimelineItem key={a.id} action={a} />
            ))}
          </ol>
        )}
      </SectionBody>
    </SectionCard>
  );
}

function TimelineItem({ action }: { action: ActionLog }) {
  const typeMeta = TYPE_META[action.type];
  const ModuleIcon = MODULE_ICON[action.module];
  const TypeIcon = typeMeta.icon;

  return (
    <li className="relative">
      {/* pastille sur la timeline */}
      <span
        className={cn(
          "absolute -left-[28px] top-0 flex h-6 w-6 items-center justify-center rounded-pill ring-2 ring-background",
          TONE_BG_SOFT[typeMeta.tone]
        )}
      >
        <TypeIcon className="h-3 w-3" />
      </span>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <ModuleIcon className="h-3 w-3" />
          <span className="font-medium uppercase tracking-wide">
            {MODULE_LABEL[action.module]}
          </span>
          <span aria-hidden>·</span>
          <span>{formatRelativeTimeFR(action.dateISO)}</span>
          <span aria-hidden>·</span>
          <span>{getActionUserLabel(action)}</span>
        </div>
        <p className="truncate text-sm text-foreground">{action.description}</p>
      </div>
    </li>
  );
}
