import {
  addDays,
  format,
  isValid,
  parse,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";

import { toIsoDate } from "@/lib/date-ranges";
import { normalizeSearchText } from "@/lib/global-search/normalize";

const WEEKDAY_MAP: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

const MONTH_MAP: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  fev: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  juil: 6,
  aout: 7,
  septembre: 8,
  sept: 8,
  octobre: 9,
  oct: 9,
  novembre: 10,
  nov: 10,
  decembre: 11,
  dec: 11,
};

function resolveWeekday(name: string, today = new Date()): Date | null {
  const target = WEEKDAY_MAP[name];
  if (target === undefined) return null;
  const d = startOfDay(today);
  const current = d.getDay();
  let diff = target - current;
  if (diff > 0) diff -= 7;
  if (diff === 0) return d;
  return addDays(d, diff);
}

function tryParseNumericDate(raw: string, today = new Date()): Date | null {
  const slash = raw.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year = slash[3]
      ? slash[3].length === 2
        ? 2000 + Number(slash[3])
        : Number(slash[3])
      : today.getFullYear();
    const d = new Date(year, month, day);
    return isValid(d) ? startOfDay(d) : null;
  }
  return null;
}

function tryParseDayMonth(raw: string, today = new Date()): Date | null {
  const m = raw.match(/^(\d{1,2})\s+([a-zéû]+)$/i);
  if (!m) return null;
  const day = Number(m[1]);
  const monthKey = normalizeSearchText(m[2]);
  const month = MONTH_MAP[monthKey];
  if (month === undefined) return null;
  let year = today.getFullYear();
  const candidate = startOfDay(new Date(year, month, day));
  if (candidate.getTime() > startOfDay(today).getTime()) {
    year -= 1;
  }
  const d = startOfDay(new Date(year, month, day));
  return isValid(d) ? d : null;
}

/**
 * Tente d'interpréter une requête comme une date terrain.
 * Ex. hier, aujourd'hui, lundi, 15/03, 15 mars, 2026-05-12
 */
export function parseSearchDate(query: string, today = new Date()): string | null {
  const q = normalizeSearchText(query);
  if (!q) return null;

  if (q === "hier") return toIsoDate(subDays(startOfDay(today), 1));
  if (q === "aujourdhui" || q === "aujourd hui" || q === "today") {
    return toIsoDate(startOfDay(today));
  }

  const weekday = resolveWeekday(q, today);
  if (weekday) return toIsoDate(weekday);

  const isoTry = parseISO(q);
  if (isValid(isoTry) && /^\d{4}-\d{2}-\d{2}/.test(q)) {
    return toIsoDate(isoTry);
  }

  for (const fmt of ["d/M/yyyy", "d-M-yyyy", "d.M.yyyy", "yyyy-MM-dd"]) {
    const parsed = parse(q, fmt, today);
    if (isValid(parsed)) return toIsoDate(parsed);
  }

  const numeric = tryParseNumericDate(q, today);
  if (numeric) return toIsoDate(numeric);

  const dayMonth = tryParseDayMonth(q, today);
  if (dayMonth) return toIsoDate(dayMonth);

  const monthOnly = MONTH_MAP[q];
  if (monthOnly !== undefined) {
    return toIsoDate(new Date(today.getFullYear(), monthOnly, 1));
  }

  return null;
}

/** Détecte un montant GNF dans la requête (≥ 3 chiffres). */
export function parseSearchAmount(query: string): number | null {
  const digits = query.replace(/[^\d]/g, "");
  if (digits.length < 3) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatSearchDayLabel(iso: string): string {
  try {
    return format(parseISO(iso), "EEEE d MMMM yyyy", { locale: fr });
  } catch {
    return iso;
  }
}
