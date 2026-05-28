import { formatDay } from "@/lib/date-ranges";
import { formatGNF, formatNumber } from "@/lib/format";
import { eggsToTrays } from "@/lib/terminology";
import type { HistoryVersionRow } from "@/components/shared/history-dialog";
import type { Depense, EntreeStatut, Production, Tresorerie, Vente } from "@/types/domain";

type LineageEntry = { id: string; lineageId?: string; statut: EntreeStatut; updatedAt: string };

export function getEntryLineageId(entry: { id: string; lineageId?: string }): string {
  return entry.lineageId ?? entry.id;
}

export function filterArchivedVersions<T extends LineageEntry>(all: T[], active: T): T[] {
  const lineage = getEntryLineageId(active);
  return all
    .filter(
      (entry) =>
        entry.statut === "archive" && getEntryLineageId(entry) === lineage
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function toProductionHistoryRows(
  versions: Production[],
  cap: number
): HistoryVersionRow[] {
  return versions.map((v) => ({
    id: v.id,
    archivedAt: v.updatedAt,
    archiveMotif: v.archiveMotif,
    fields: [
      {
        label: "Ramassées",
        value: `${formatNumber(eggsToTrays(v.production, cap))} alv.`,
      },
      {
        label: "Mises en vente",
        value: `${formatNumber(eggsToTrays(v.envoyesVente, cap))} alv.`,
      },
      { label: "Cassés", value: `${formatNumber(v.casses)} œufs` },
      ...(v.notes?.trim() ? [{ label: "Notes", value: v.notes.trim() }] : []),
    ],
  }));
}

export function toSaleHistoryRows(versions: Vente[], cap: number): HistoryVersionRow[] {
  return versions.map((v) => ({
    id: v.id,
    archivedAt: v.updatedAt,
    archiveMotif: v.archiveMotif,
    fields: [
      { label: "Alvéoles", value: `${formatNumber(eggsToTrays(v.vendus, cap))} alv.` },
      { label: "Prix", value: `${formatGNF(v.prix)} / alv.` },
      { label: "Cassés", value: `${formatNumber(v.cassesVente)} œufs` },
      ...(v.client?.trim() ? [{ label: "Client", value: v.client.trim() }] : []),
      { label: "Montant", value: formatGNF(v.montant) },
    ],
  }));
}

export function toExpenseHistoryRows(versions: Depense[]): HistoryVersionRow[] {
  return versions.map((v) => ({
    id: v.id,
    archivedAt: v.updatedAt,
    archiveMotif: v.archiveMotif,
    fields: [
      { label: "Catégorie", value: v.categorie },
      { label: "Montant", value: formatGNF(v.montant) },
      ...(v.description?.trim()
        ? [{ label: "Description", value: v.description.trim() }]
        : []),
    ],
  }));
}

export function toTresorerieHistoryRows(versions: Tresorerie[]): HistoryVersionRow[] {
  return versions.map((v) => ({
    id: v.id,
    archivedAt: v.updatedAt,
    archiveMotif: v.archiveMotif,
    fields: [
      { label: "Reçu", value: formatGNF(v.montantRecu) },
      { label: "Versé", value: formatGNF(v.depose) },
      { label: "Méthode", value: v.methode },
      ...(v.note?.trim() ? [{ label: "Note", value: v.note.trim() }] : []),
    ],
  }));
}

export function formatEntryDaySubtitle(jourISO: string): string {
  const d = new Date(jourISO);
  return Number.isNaN(d.getTime()) ? jourISO : formatDay(d);
}
