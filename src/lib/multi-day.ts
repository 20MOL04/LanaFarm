import { eachDayOfInterval, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

import type { Depense, Production, Tresorerie, Vente } from "@/types/domain";

export const MULTI_DAY_MAX = 31;

/**
 * Borne une période multi-jours à aujourd'hui (saisie impossible dans le futur).
 * Évite le blocage HTML5 quand le calendrier global dépasse la date du jour.
 */
export function clampMultiDayPeriod(
  fromIso: string,
  toIso: string,
  maxIso: string
): { fromIso: string; toIso: string } {
  let from = fromIso;
  let to = toIso;
  if (to > maxIso) to = maxIso;
  if (from > maxIso) from = maxIso;
  if (from > to) from = to;
  return { fromIso: from, toIso: to };
}

export function dayKeyFromISO(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? NaN : startOfDay(d).getTime();
}

/** Jours calendaires inclusifs entre deux champs date (yyyy-MM-dd). */
export function enumerateDayISOs(fromIso: string, toIso: string): string[] {
  const from = startOfDay(new Date(fromIso));
  const to = startOfDay(new Date(toIso));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [];
  }
  const days = eachDayOfInterval({ start: from, end: to });
  return days.slice(0, MULTI_DAY_MAX).map((d) => format(d, "yyyy-MM-dd"));
}

export function formatDayShortFR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "d/MM/yyyy", { locale: fr });
}

export function formatDayListFR(isoDays: string[]): string {
  return isoDays.map(formatDayShortFR).join(", ");
}

export function syncLinesWithPeriod<T extends { jourISO: string }>(
  prev: T[],
  dayISOs: string[],
  createEmpty: (jourISO: string) => T
): T[] {
  const byDay = new Map(prev.map((line) => [line.jourISO, line]));
  return dayISOs.map((jourISO) => byDay.get(jourISO) ?? createEmpty(jourISO));
}

export function findActiveProductionForDay(
  productions: Production[],
  jourISO: string
): Production | undefined {
  const key = dayKeyFromISO(jourISO);
  if (Number.isNaN(key)) return undefined;
  return productions.find(
    (p) => p.statut === "actif" && dayKeyFromISO(p.jourISO) === key
  );
}

export function getActiveVentesForDay(ventes: Vente[], jourISO: string): Vente[] {
  const key = dayKeyFromISO(jourISO);
  if (Number.isNaN(key)) return [];
  return ventes.filter(
    (v) => v.statut === "actif" && dayKeyFromISO(v.jourISO) === key
  );
}

export function getActiveDepensesForDay(depenses: Depense[], jourISO: string): Depense[] {
  const key = dayKeyFromISO(jourISO);
  if (Number.isNaN(key)) return [];
  return depenses.filter(
    (d) => d.statut === "actif" && dayKeyFromISO(d.jourISO) === key
  );
}

export function hasActiveDepensesForDay(depenses: Depense[], jourISO: string): boolean {
  return getActiveDepensesForDay(depenses, jourISO).length > 0;
}

export function getActiveTresorerieForDay(
  tresorerie: Tresorerie[],
  jourISO: string
): Tresorerie[] {
  const key = dayKeyFromISO(jourISO);
  if (Number.isNaN(key)) return [];
  return tresorerie.filter(
    (t) => t.statut === "actif" && dayKeyFromISO(t.jourISO) === key
  );
}

export function hasActiveTresorerieForDay(
  tresorerie: Tresorerie[],
  jourISO: string
): boolean {
  return getActiveTresorerieForDay(tresorerie, jourISO).length > 0;
}

export type MultiDayConflictResolution = "replace" | "ignore";
