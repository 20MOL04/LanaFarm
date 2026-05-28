import ExcelJS from "exceljs";

import { loadBrandLogoForExport } from "@/lib/brand/load-logo-export";
import { site } from "@/config/site";
import { formatGNFForExport } from "@/lib/format-export";
import type { ReportPayload } from "@/lib/reports-calc";
import { KPI_LABEL } from "@/lib/terminology";

const LOGO_PX = 56;
const HEADER_ROWS = 5;

function addLogoToSheet(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  logoBase64: string
): number {
  const imageId = workbook.addImage({
    base64: logoBase64,
    extension: "png",
  });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: LOGO_PX, height: LOGO_PX },
  });
  sheet.getRow(1).height = 44;
  return HEADER_ROWS;
}

function writeRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: (string | number)[][]
): void {
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      sheet.getCell(startRow + ri, ci + 1).value = cell;
    });
  });
}

function buildSynthèseRows(p: ReportPayload): (string | number)[][] {
  const k = p.kpis;
  return [
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
    [KPI_LABEL.alveolesRamassees, Math.round(k.alveolesRamassees)],
    [KPI_LABEL.alveolesMisesEnVente, Math.round(k.alveolesMisesEnVente)],
    ["Chiffre d'affaires", formatGNFForExport(k.chiffreAffaires)],
    ["Total depenses", formatGNFForExport(k.totalDepenses)],
    ["Profit", formatGNFForExport(k.profit)],
    ["Pertes totales", k.pertesTotales],
    ["Montant remis", formatGNFForExport(k.montantRemis)],
    ["Reste a verser (periode)", formatGNFForExport(k.montantEnAttente)],
    ["Marge brute", k.margeBrutePct != null ? `${k.margeBrutePct} %` : "—"],
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
}

function styleSynthèseHeader(sheet: ExcelJS.Worksheet, startRow: number): void {
  const title = sheet.getCell(startRow, 1);
  title.font = { bold: true, size: 16, color: { argb: "FF1D4ED8" } };
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 22;
}

export function reportExcelFilename(p: ReportPayload): string {
  const from = p.fromISO.slice(0, 10);
  const to = p.toISO.slice(0, 10);
  return `LanaFarm_Rapport_${p.type}_${from}_${to}.xlsx`;
}

export async function exportReportToExcel(payload: ReportPayload): Promise<void> {
  const { base64: logoBase64 } = await loadBrandLogoForExport();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = site.name;

  const synth = workbook.addWorksheet("Synthèse");
  const synthStart = addLogoToSheet(workbook, synth, logoBase64);
  writeRows(synth, synthStart, buildSynthèseRows(payload));
  styleSynthèseHeader(synth, synthStart);

  const prod = workbook.addWorksheet("Production");
  const prodStart = addLogoToSheet(workbook, prod, logoBase64);
  writeRows(prod, prodStart, [
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
    ...payload.detail.production.map((r) => [
      r.jour,
      r.ramassees,
      r.misesVente,
      r.casses,
      r.perdus,
      r.restantes,
      r.statut,
      r.notes,
    ]),
  ]);

  const ventes = workbook.addWorksheet("Ventes");
  const ventesStart = addLogoToSheet(workbook, ventes, logoBase64);
  writeRows(ventes, ventesStart, [
    [
      "Jour",
      "Vendus (alv.)",
      "Cassés vente",
      "Prix casier",
      "Montant GNF",
      "Client",
      "Statut",
    ],
    ...payload.detail.ventes.map((r) => [
      r.jour,
      r.vendus,
      r.cassesVente,
      r.prix,
      r.montant,
      r.client,
      r.statut,
    ]),
  ]);

  const dep = workbook.addWorksheet("Dépenses");
  const depStart = addLogoToSheet(workbook, dep, logoBase64);
  writeRows(dep, depStart, [
    ["Jour", "Catégorie", "Montant GNF", "Description", "Statut"],
    ...payload.detail.depenses.map((r) => [
      r.jour,
      r.categorie,
      r.montant,
      r.description,
      r.statut,
    ]),
  ]);

  const tres = workbook.addWorksheet("Trésorerie");
  const tresStart = addLogoToSheet(workbook, tres, logoBase64);
  writeRows(tres, tresStart, [
    ["Jour", "Reçu GNF", "Versé GNF", "Reste GNF", "Méthode", "Statut", "Note"],
    ...payload.detail.tresorerie.map((r) => [
      r.jour,
      r.montantRecu,
      r.depose,
      r.reste,
      r.methode,
      r.statut,
      r.note,
    ]),
  ]);

  if (payload.detail.transferts.length > 0) {
    const tr = workbook.addWorksheet("Transferts");
    const trStart = addLogoToSheet(workbook, tr, logoBase64);
    writeRows(tr, trStart, [
      ["Jour", "Envoyé (alv.)", "Reçu (alv.)", "Écart", "Statut", "Note"],
      ...payload.detail.transferts.map((r) => [
        r.jour,
        r.quantiteEnvoyee,
        r.quantiteRecue ?? "",
        r.ecart ?? "",
        r.statut,
        r.note,
      ]),
    ]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = reportExcelFilename(payload);
  anchor.click();
  URL.revokeObjectURL(url);
}
