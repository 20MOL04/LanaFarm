"use client";

import * as React from "react";

import { HistoryKpis } from "@/components/history/history-kpis";
import { HistoryTable } from "@/components/history/history-table";
import { HistoryTimeline } from "@/components/history/history-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/contexts/date-range-context";
import { useActionsInRange } from "@/hooks/use-actions-in-range";
import { formatRange } from "@/lib/date-ranges";
import { buildHistoryCounters } from "@/lib/history-calc";

/**
 * Module Historique — centre de traçabilité opérationnelle.
 *
 * Source unique : `state.actions` (journal alimenté par tous les reducers).
 * Réagit au calendrier global + filtres locaux (module, type, recherche).
 */
export function HistoryModule() {
  const { range } = useDateRange();
  const actions = useActionsInRange();
  const counters = React.useMemo(
    () => buildHistoryCounters(actions),
    [actions]
  );

  return (
    <>
      <PageHeader
        title="Historique"
        actions={<Badge tone="outline">{formatRange(range)}</Badge>}
      />

      <HistoryKpis counters={counters} />

      <div className="grid-contained gap-4 grid-cols-1 xl:grid-cols-[1.6fr_1fr]">
        <HistoryTable actions={actions} />
        <HistoryTimeline actions={actions} />
      </div>
    </>
  );
}
