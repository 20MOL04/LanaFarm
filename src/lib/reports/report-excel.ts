import * as XLSX from "xlsx";

import { site } from "@/config/site";
import { formatGNFForExport } from "@/lib/format-export";
import type { ReportPayload } from "@/lib/reports-calc";
import { KPI_LABEL } from "@/lib/terminology";

function sheetFromAoa(data: string[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(data);
}

function buildSynthèseSheet(p: ReportPayload): XLSX.WorkSheet {
  const k = p.kpis;
  const header: string[][] = [
    [site.name],
    [p.periodLabel.replace(/\s*→\s*/g, " au ")],
    [
      `Genere le ${new Date(p.generatedAt).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      })}`,
    ],
    [],
    ["KPI", "Valeur"],
    [KPI_LABEL.alveolesRamassees, String(Math.round(k.alveolesRamassees))],
    [KPI_LABEL.alveolesMisesEnVente, String(Math.round(k.alveolesMisesEnVente))],
    ["Chiffre d'affaires", formatGNFForExport(k.chiffreAffaires)],
    ["Total depenses", formatGNFForExport(k.totalDepenses)],
    ["Profit", formatGNFForExport(k.profit)],
    ["Pertes totales", String(k.pertesTotales)],
    ["Montant remis", formatGNFForExport(k.montantRemis)],
    ["Reste a verser (periode)", formatGNFForExport(k.montantEnAttente)],
    [
      "Marge brute",
      k.margeBrutePct != null ? `${k.margeBrutePct} %` : "—",
    ],
    [],
    ["Production", ""],
    ...p.productionRows.map((r) => [r.label, r.value]),
    [],
    ["Ventes", ""],
    ...p.salesRows.map((r) => [r.label, r.value]),
    [],
    ["Dépenses", ""],
    ...p.expensesRows.map((r) => [r.label, r.value]),
    [],
    ["Trésorerie", ""],
    ...p.treasuryRows.map((r) => [r.label, r.value]),
  ];
  return sheetFromAoa(header);
}

function buildProductionSheet(p: ReportPayload): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    [
      "Jour",
      "Ramassées (alv.)",
      "Mises vente",
      "Cassés (œufs)",
      "Perdus",
      "Restantes",
      "Statut",
      "Notes",
    ],
    ...p.detail.production.map((r) => [
      r.jour,
      r.ramassees,
      r.misesVente,
      r.casses,
      r.perdus,
      r.restantes,
      r.statut,
      r.notes,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

function buildVentesSheet(p: ReportPayload): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    [
      "Jour",
      "Vendus (alv.)",
      "Cassés vente",
      "Prix casier",
      "Montant GNF",
      "Client",
      "Statut",
    ],
    ...p.detail.ventes.map((r) => [
      r.jour,
      r.vendus,
      r.cassesVente,
      r.prix,
      r.montant,
      r.client,
      r.statut,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

function buildDepensesSheet(p: ReportPayload): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    ["Jour", "Catégorie", "Montant GNF", "Description", "Statut"],
    ...p.detail.depenses.map((r) => [
      r.jour,
      r.categorie,
      r.montant,
      r.description,
      r.statut,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

function buildTresorerieSheet(p: ReportPayload): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    [
      "Jour",
      "Reçu GNF",
      "Versé GNF",
      "Reste GNF",
      "Méthode",
      "Statut",
      "Note",
    ],
    ...p.detail.tresorerie.map((r) => [
      r.jour,
      r.montantRecu,
      r.depose,
      r.reste,
      r.methode,
      r.statut,
      r.note,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

function buildTransfertsSheet(p: ReportPayload): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    [
      "Jour",
      "Envoyé (alv.)",
      "Reçu (alv.)",
      "Écart",
      "Statut",
      "Note",
    ],
    ...p.detail.transferts.map((r) => [
      r.jour,
      r.quantiteEnvoyee,
      r.quantiteRecue ?? "",
      r.ecart ?? "",
      r.statut,
      r.note,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

export function reportExcelFilename(p: ReportPayload): string {
  const from = p.fromISO.slice(0, 10);
  const to = p.toISO.slice(0, 10);
  return `LanaFarm_Rapport_${p.type}_${from}_${to}.xlsx`;
}

export function exportReportToExcel(payload: ReportPayload): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSynthèseSheet(payload), "Synthèse");
  XLSX.utils.book_append_sheet(wb, buildProductionSheet(payload), "Production");
  XLSX.utils.book_append_sheet(wb, buildVentesSheet(payload), "Ventes");
  XLSX.utils.book_append_sheet(wb, buildDepensesSheet(payload), "Dépenses");
  XLSX.utils.book_append_sheet(wb, buildTresorerieSheet(payload), "Trésorerie");
  if (payload.detail.transferts.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildTransfertsSheet(payload), "Transferts");
  }
  XLSX.writeFile(wb, reportExcelFilename(payload));
}
