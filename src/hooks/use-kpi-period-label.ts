"use client";

import * as React from "react";

import { useDateRange } from "@/contexts/date-range-context";
import {
  type KpiPeriodKind,
  getKpiPeriodPhrase,
  kpiLabelWithPeriod,
} from "@/lib/kpi-period";

/**
 * Libellé KPI avec période dans le titre (calendrier global).
 */
export function useKpiPeriodLabel(
  baseLabel: string,
  kind: KpiPeriodKind = "flow"
): string {
  const { presetId, range } = useDateRange();
  return React.useMemo(
    () => kpiLabelWithPeriod(baseLabel, presetId, range, kind),
    [baseLabel, presetId, range, kind]
  );
}

export function useKpiPeriodPhrase(kind: KpiPeriodKind = "flow"): string {
  const { presetId, range } = useDateRange();
  return React.useMemo(
    () => getKpiPeriodPhrase(presetId, range, kind),
    [presetId, range, kind]
  );
}
