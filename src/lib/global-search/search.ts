import { normalizeAmountQuery, normalizeSearchText, tokenizeQuery } from "@/lib/global-search/normalize";
import { parseSearchAmount, parseSearchDate } from "@/lib/global-search/parse-query";
import type {
  GlobalSearchEntry,
  GlobalSearchGroup,
  GlobalSearchResult,
} from "@/lib/global-search/types";

const GROUP_ORDER = [
  "Actions rapides",
  "Pages",
  "Jours",
  "Clients",
  "Ventes",
  "Production",
  "Dépenses",
  "Trésorerie",
  "Historique",
];

function scoreEntry(
  entry: GlobalSearchEntry,
  tokens: string[],
  parsedDateISO: string | null,
  amount: number | null
): number {
  if (tokens.length === 0) return entry.priority;

  const hay = entry.keywords;
  let score = entry.priority;

  if (parsedDateISO && entry.jourISO === parsedDateISO) {
    score += 120;
  }

  if (amount !== null && hay.includes(normalizeAmountQuery(String(amount)))) {
    score += 80;
  }

  let matched = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      matched += 1;
      if (entry.title && normalizeSearchText(entry.title).includes(token)) {
        score += 25;
      }
      if (entry.subtitle && normalizeSearchText(entry.subtitle).includes(token)) {
        score += 10;
      }
    }
  }

  if (matched === 0) return -1;
  score += matched * 15;
  if (matched === tokens.length) score += 20;

  return score;
}

function groupResults(entries: GlobalSearchEntry[]): GlobalSearchGroup[] {
  const map = new Map<string, GlobalSearchEntry[]>();
  for (const entry of entries) {
    if (!map.has(entry.group)) map.set(entry.group, []);
    map.get(entry.group)!.push(entry);
  }

  return GROUP_ORDER.filter((g) => map.has(g)).map((label) => ({
    id: normalizeSearchText(label).replace(/\s+/g, "-"),
    label,
    entries: map.get(label)!,
  }));
}

export function searchGlobalIndex(
  index: GlobalSearchEntry[],
  query: string,
  limit = 40
): GlobalSearchResult {
  const trimmed = query.trim();
  const tokens = tokenizeQuery(trimmed);
  const parsedDateISO = parseSearchDate(trimmed);
  const amount = parseSearchAmount(trimmed);

  if (!trimmed) {
    const defaults = index
      .filter((e) => e.kind === "action" || e.kind === "page")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 12);
    return {
      query: trimmed,
      parsedDateISO: null,
      groups: groupResults(defaults),
      total: defaults.length,
    };
  }

  const scored = index
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, tokens, parsedDateISO, amount),
    }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.entry.priority - a.entry.priority);

  const seen = new Set<string>();
  const picked: GlobalSearchEntry[] = [];
  for (const { entry } of scored) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    picked.push(entry);
    if (picked.length >= limit) break;
  }

  if (parsedDateISO && !picked.some((e) => e.jourISO === parsedDateISO)) {
    const dayFallback = index.filter((e) => e.jourISO === parsedDateISO);
    for (const e of dayFallback) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        picked.unshift(e);
      }
    }
  }

  return {
    query: trimmed,
    parsedDateISO,
    groups: groupResults(picked),
    total: picked.length,
  };
}
