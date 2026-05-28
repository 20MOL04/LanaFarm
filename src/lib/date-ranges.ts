/**
 * Système central de plages de dates.
 * Sert le calendrier global qui pilote TOUTE l'application.
 */

import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";

export type DateRangePresetId =
  | "today"
  | "this-week"
  | "this-month"
  | "last-7"
  | "last-30"
  | "last-90"
  | "custom";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateRangePreset = {
  id: DateRangePresetId;
  label: string;
  /** Calcule la plage à partir d'aujourd'hui. */
  build: (today?: Date) => DateRange;
};

const startOfWeekFR = (d: Date) => startOfWeek(d, { weekStartsOn: 1, locale: fr });
const endOfWeekFR = (d: Date) => endOfWeek(d, { weekStartsOn: 1, locale: fr });

export const dateRangePresets: DateRangePreset[] = [
  {
    id: "today",
    label: "Aujourd'hui",
    build: (today = new Date()) => ({
      from: startOfDay(today),
      to: endOfDay(today),
    }),
  },
  {
    id: "this-week",
    label: "Cette semaine",
    build: (today = new Date()) => ({
      from: startOfWeekFR(today),
      to: endOfWeekFR(today),
    }),
  },
  {
    id: "this-month",
    label: "Ce mois-ci",
    build: (today = new Date()) => ({
      from: startOfMonth(today),
      to: endOfMonth(today),
    }),
  },
  {
    id: "last-7",
    label: "7 derniers jours",
    build: (today = new Date()) => ({
      from: startOfDay(subDays(today, 6)),
      to: endOfDay(today),
    }),
  },
  {
    id: "last-30",
    label: "30 derniers jours",
    build: (today = new Date()) => ({
      from: startOfDay(subDays(today, 29)),
      to: endOfDay(today),
    }),
  },
  {
    id: "last-90",
    label: "90 derniers jours",
    build: (today = new Date()) => ({
      from: startOfDay(subDays(today, 89)),
      to: endOfDay(today),
    }),
  },
  {
    id: "custom",
    label: "Personnalisé",
    build: (today = new Date()) => ({
      from: startOfDay(subDays(today, 13)),
      to: endOfDay(today),
    }),
  },
];

export function getPreset(id: DateRangePresetId): DateRangePreset {
  return dateRangePresets.find((p) => p.id === id) ?? dateRangePresets[2];
}

/** Affichage humain d'une plage — ex : "12 mai → 24 mai 2026". */
export function formatRange(range: DateRange): string {
  const sameYear = range.from.getFullYear() === range.to.getFullYear();
  const sameMonth = sameYear && range.from.getMonth() === range.to.getMonth();
  const sameDay = sameMonth && range.from.getDate() === range.to.getDate();

  if (sameDay) {
    return format(range.from, "d MMMM yyyy", { locale: fr });
  }
  if (sameMonth) {
    return `${format(range.from, "d", { locale: fr })} → ${format(range.to, "d MMMM yyyy", { locale: fr })}`;
  }
  if (sameYear) {
    return `${format(range.from, "d MMM", { locale: fr })} → ${format(range.to, "d MMM yyyy", { locale: fr })}`;
  }
  return `${format(range.from, "d MMM yyyy", { locale: fr })} → ${format(range.to, "d MMM yyyy", { locale: fr })}`;
}

export function formatDateShort(d: Date): string {
  return format(d, "d MMM yyyy", { locale: fr });
}

export function formatDay(d: Date): string {
  return format(d, "EEEE d MMMM", { locale: fr });
}
