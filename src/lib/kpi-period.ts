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

export type KpiPeriodKind = "flow" | "snapshot";

/** Phrase temporelle courte (minuscule) — presets standards. */
const PRESET_PERIOD_PHRASE: Record<Exclude<DateRangePresetId, "custom">, string> = {
  today: "aujourd'hui",
  "this-week": "cette semaine",
  "this-month": "ce mois-ci",
  "last-7": "7 derniers jours",
  "last-30": "30 derniers jours",
  "last-90": "90 derniers jours",
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

/** Titre carte : « Alvéoles dispo (Ferme) cette semaine », « Stock vente », etc. */
export function kpiLabelWithPeriod(
  baseLabel: string,
  presetId: DateRangePresetId,
  range: DateRange,
  kind: KpiPeriodKind = "flow"
): string {
  // Décision CEO — 3 KPI fixes : jamais suffixés par une période.
  if (
    baseLabel === "Alvéoles dispo (Ferme)" ||
    baseLabel === "Stock vente" ||
    baseLabel === "Reste à verser"
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
