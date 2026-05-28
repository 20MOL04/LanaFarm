import { startOfDay } from "date-fns";

import type { SaleRowView } from "@/lib/sales-calc";
import { resolveCategorieLabel } from "@/lib/config-defaults";
import { formatGNF } from "@/lib/format";
import { eggsToTrays } from "@/lib/terminology";
import type { Depense, EntreeStatut, FarmConfig } from "@/types/domain";

export type AggregatedDayStatut = EntreeStatut | "mixte";

export type DayGroupBase = {
  dayKey: string;
  jourISO: string;
  entryIds: string[];
  count: number;
  countActif: number;
  countAnnule: number;
  countArchive: number;
  statut: AggregatedDayStatut;
};

export type SalesDayGroup = DayGroupBase & {
  kind: "vente";
  totalMontant: number;
  totalAlveoles: number;
  totalCassesOeufs: number;
  clients: string[];
  prixMin: number;
  prixMax: number;
  prixLabel: string;
  entries: SaleRowView[];
  recuAlveoles: number;
  resteAlveoles: number;
};

export type ExpenseDayGroup = DayGroupBase & {
  kind: "depense";
  totalMontant: number;
  categories: string[];
  descriptionLabel: string;
  entries: Depense[];
};

export function dayKeyFromISO(jourISO: string): string {
  return startOfDay(new Date(jourISO)).toISOString();
}

export function aggregateDayStatut(entries: { statut: EntreeStatut }[]): AggregatedDayStatut {
  if (entries.length === 0) return "actif";
  const statuts = new Set(entries.map((e) => e.statut));
  if (statuts.size === 1) return entries[0]!.statut;
  return "mixte";
}

export function countByStatut(entries: { statut: EntreeStatut }[]) {
  let countActif = 0;
  let countAnnule = 0;
  let countArchive = 0;
  for (const e of entries) {
    if (e.statut === "actif") countActif += 1;
    else if (e.statut === "annule") countAnnule += 1;
    else countArchive += 1;
  }
  return { countActif, countAnnule, countArchive };
}

export function formatCategoriesSummary(labels: string[]): string {
  if (labels.length === 0) return "—";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} (+${labels.length - 2})`;
}

export function formatSalesClientsSummary(clients: string[], count: number): string {
  if (count <= 1) {
    return clients[0] ?? "";
  }
  if (clients.length > 0) {
    return clients.length <= 2
      ? clients.join(", ")
      : `${clients[0]} (+${clients.length - 1})`;
  }
  return `${count} ventes`;
}

export function formatSalesPriceLabel(prixMin: number, prixMax: number): string {
  if (prixMin <= 0 && prixMax <= 0) return "—";
  if (prixMin === prixMax) return formatGNF(prixMin);
  if (prixMin > 0 && prixMax > 0) {
    return `${formatGNF(prixMin)} – ${formatGNF(prixMax)}`;
  }
  return "Mixte";
}

export function formatAggregatedStatutTitle(group: DayGroupBase): string | undefined {
  if (group.statut !== "mixte") return undefined;
  const parts: string[] = [];
  if (group.countActif > 0) parts.push(`${group.countActif} active${group.countActif > 1 ? "s" : ""}`);
  if (group.countAnnule > 0) parts.push(`${group.countAnnule} annulée${group.countAnnule > 1 ? "s" : ""}`);
  if (group.countArchive > 0) parts.push(`${group.countArchive} archivée${group.countArchive > 1 ? "s" : ""}`);
  return parts.join(", ");
}

function buildDayGroupBase(entries: { id: string; statut: EntreeStatut; jourISO: string }[]): DayGroupBase {
  const { countActif, countAnnule, countArchive } = countByStatut(entries);
  const jourISO = entries[0]?.jourISO ?? new Date().toISOString();
  return {
    dayKey: dayKeyFromISO(jourISO),
    jourISO,
    entryIds: entries.map((e) => e.id),
    count: entries.length,
    countActif,
    countAnnule,
    countArchive,
    statut: aggregateDayStatut(entries),
  };
}

export function groupSalesByDay(rows: SaleRowView[], capacitePlateau: number): SalesDayGroup[] {
  const byDay = new Map<string, SaleRowView[]>();
  for (const row of rows) {
    const key = dayKeyFromISO(row.vente.jourISO);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  const groups: SalesDayGroup[] = [];
  for (const entries of byDay.values()) {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.vente.jourISO).getTime() - new Date(a.vente.jourISO).getTime()
    );
    const base = buildDayGroupBase(sorted.map((r) => r.vente));
    const actives = sorted.filter((r) => r.vente.statut === "actif");

    let totalMontant = 0;
    let totalAlveoles = 0;
    let totalCassesOeufs = 0;
    const clients: string[] = [];
    const prixValues: number[] = [];

    for (const row of actives) {
      totalMontant += row.montant;
      totalAlveoles += eggsToTrays(row.vente.vendus, capacitePlateau);
      totalCassesOeufs += row.vente.cassesVente;
      if (row.vente.prix > 0) prixValues.push(row.vente.prix);
      const client = row.vente.client?.trim();
      if (client && !clients.includes(client)) clients.push(client);
    }

    const prixMin = prixValues.length > 0 ? Math.min(...prixValues) : 0;
    const prixMax = prixValues.length > 0 ? Math.max(...prixValues) : 0;
    const first = sorted[0]!;

    groups.push({
      ...base,
      kind: "vente",
      totalMontant,
      totalAlveoles,
      totalCassesOeufs,
      clients,
      prixMin,
      prixMax,
      prixLabel: formatSalesPriceLabel(prixMin, prixMax),
      entries: sorted,
      recuAlveoles: eggsToTrays(first.recuFermeJour, capacitePlateau),
      resteAlveoles: eggsToTrays(first.resteVenteJour, capacitePlateau),
    });
  }

  return groups.sort(
    (a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime()
  );
}

export function groupExpensesByDay(rows: Depense[], config: FarmConfig): ExpenseDayGroup[] {
  const byDay = new Map<string, Depense[]>();
  for (const row of rows) {
    const key = dayKeyFromISO(row.jourISO);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  const groups: ExpenseDayGroup[] = [];
  for (const entries of byDay.values()) {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime()
    );
    const base = buildDayGroupBase(sorted);
    const actives = sorted.filter((e) => e.statut === "actif");

    let totalMontant = 0;
    const categories: string[] = [];
    for (const row of actives) {
      totalMontant += row.montant;
      const label = resolveCategorieLabel(row.categorie, config.listes.categoriesDepense);
      if (!categories.includes(label)) categories.push(label);
    }

    const descriptions = sorted
      .map((e) => e.description?.trim())
      .filter((d): d is string => !!d);
    const descriptionLabel =
      sorted.length === 1 ? descriptions[0] ?? "—" : descriptions.length === 1 ? descriptions[0]! : "—";

    groups.push({
      ...base,
      kind: "depense",
      totalMontant,
      categories,
      descriptionLabel,
      entries: sorted,
    });
  }

  return groups.sort(
    (a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime()
  );
}

/** Jour visible si au moins une entrée correspond au filtre statut. */
export function entriesMatchStatutFilter(
  entries: { statut: EntreeStatut }[],
  statusFilter: "tous" | EntreeStatut
): boolean {
  if (statusFilter === "tous") return true;
  return entries.some((e) => e.statut === statusFilter);
}
