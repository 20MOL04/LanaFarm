import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { site } from "@/config/site";
import {
  formatAlveolesForExport,
  formatGNFForExport,
  formatTextForExport,
} from "@/lib/format-export";
import type { ReportPayload } from "@/lib/reports-calc";
import {
  PDF_BRAND_RGB,
  PDF_CONTENT_WIDTH,
  PDF_PAGE,
  pdfLastTableY,
  pdfTableBase,
} from "@/lib/reports/report-pdf-styles";

export function reportPdfFilename(p: ReportPayload): string {
  const from = p.fromISO.slice(0, 10);
  const to = p.toISO.slice(0, 10);
  return `LanaFarm_Rapport_${p.type}_${from}_${to}.pdf`;
}

function drawBrandHeader(
  doc: jsPDF,
  periodLabel: string,
  generatedAt: string
): number {
  const x = PDF_PAGE.margin;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...PDF_BRAND_RGB);
  doc.text(site.name, x, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rapport — ${formatTextForExport(periodLabel)}`, x, y);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(formatTextForExport(generatedAt), x, y);

  return y + 10;
}

export function downloadReportPdf(payload: ReportPayload): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const k = payload.kpis;
  const generatedLabel = `Genere le ${new Date(payload.generatedAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;

  let y = drawBrandHeader(doc, payload.periodLabel, generatedLabel);

  autoTable(doc, {
    ...pdfTableBase(),
    startY: y,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Chiffre d'affaires", formatGNFForExport(k.chiffreAffaires)],
      ["Depenses", formatGNFForExport(k.totalDepenses)],
      ["Profit", formatGNFForExport(k.profit)],
      ["Montant remis", formatGNFForExport(k.montantRemis)],
      ["Reste a verser", formatGNFForExport(k.montantEnAttente)],
      [
        "Marge brute",
        k.margeBrutePct != null ? `${Math.round(k.margeBrutePct)} %` : "—",
      ],
    ],
    columnStyles: {
      0: { cellWidth: PDF_CONTENT_WIDTH * 0.55 },
      1: {
        cellWidth: PDF_CONTENT_WIDTH * 0.45,
        halign: "right",
        fontStyle: "bold",
      },
    },
  });

  y = pdfLastTableY(doc) + 8;

  if (payload.detail.production.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Production — detail journalier", PDF_PAGE.margin, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableBase(),
      startY: y,
      head: [["Jour", "Ramassees", "Mises vente", "Statut"]],
      body: payload.detail.production.slice(0, 45).map((r) => [
        formatTextForExport(r.jour),
        formatAlveolesForExport(r.ramassees),
        formatAlveolesForExport(r.misesVente),
        r.statut,
      ]),
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 32, halign: "right" },
        2: { cellWidth: 32, halign: "right" },
        3: { cellWidth: PDF_CONTENT_WIDTH - 58 - 32 - 32, halign: "center" },
      },
    });
    y = pdfLastTableY(doc) + 8;
  }

  if (y > 248 && payload.detail.ventes.length > 0) {
    doc.addPage();
    y = PDF_PAGE.margin;
  }

  if (payload.detail.ventes.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Ventes — detail journalier", PDF_PAGE.margin, y);
    y += 5;

    autoTable(doc, {
      ...pdfTableBase(),
      startY: y,
      head: [["Jour", "Vendus", "Montant", "Statut"]],
      body: payload.detail.ventes.slice(0, 45).map((r) => [
        formatTextForExport(r.jour),
        formatAlveolesForExport(r.vendus),
        formatGNFForExport(r.montant),
        r.statut,
      ]),
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 28, halign: "right" },
        2: { cellWidth: 52, halign: "right", fontStyle: "bold" },
        3: { cellWidth: PDF_CONTENT_WIDTH - 58 - 28 - 52, halign: "center" },
      },
    });
  }

  doc.save(reportPdfFilename(payload));
}
