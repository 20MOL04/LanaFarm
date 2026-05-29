/**
 * Libellés KPI avec expression temporelle — pilotés par le calendrier global.
 * Le chiffre reste seul sous le titre ; la période est dans le label.
 */

import { format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

import {
  type DateRange,
  type DateRangePresetId,
  formatRange,
} from "@/lib/date-ranges";
import { KPI_LABEL } from "@/lib/terminology";

export type KpiPeriodKind = "flow" | "snapshot";

/** Phrase temporelle courte (minuscule) — presets standards. */
const PRESET_PERIOD_PHRASE: Record<Exclude<DateRangePresetId, "custom">, string> = {
  "this-week": "cette semaine",
  "this-month": "ce mois-ci",
};

function flowPeriodPhrase(presetId: DateRangePresetId, range: DateRange): string {
  if (presetId !== "custom") {
    return PRESET_PERIOD_PHRASE[presetId];
  }
  if (isSameDay(startOfDay(range.from), startOfDay(range.to))) {
    return format(range.from, "d MMMM yyyy", { locale: fr });
  }
  return formatRange(range);
}

function snapshotPeriodPhrase(presetId: DateRangePresetId, range: DateRange): string {
  if (presetId === "custom") {
    return `au ${format(range.to, "d MMM yyyy", { locale: fr })}`;
  }
  return "";
}

/** Phrase temporelle selon le type de KPI. */
export function getKpiPeriodPhrase(
  presetId: DateRangePresetId,
  range: DateRange,
  kind: KpiPeriodKind = "flow"
): string {
  return kind === "snapshot"
    ? snapshotPeriodPhrase(presetId, range)
    : flowPeriodPhrase(presetId, range);
}

/** Titre carte : « Stock ferme », « Stock vente », etc. */
export function kpiLabelWithPeriod(
  baseLabel: string,
  presetId: DateRangePresetId,
  range: DateRange,
  kind: KpiPeriodKind = "flow"
): string {
  // Décision CEO — 3 KPI fixes : jamais suffixés par une période.
  if (
    baseLabel === KPI_LABEL.stockFerme ||
    baseLabel === KPI_LABEL.stockVente ||
    baseLabel === KPI_LABEL.resteAVerser
  ) {
    return baseLabel;
  }
  const phrase = getKpiPeriodPhrase(presetId, range, kind);
  return phrase ? `${baseLabel} ${phrase}` : baseLabel;
}

/** Sous-titre de page module — ex. « Vue d'ensemble · aujourd'hui ». */
export function moduleOverviewSubtitle(
  presetId: DateRangePresetId,
  range: DateRange
): string {
  return `Vue d'ensemble · ${getKpiPeriodPhrase(presetId, range, "flow")}`;
}
