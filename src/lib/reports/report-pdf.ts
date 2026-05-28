import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { loadBrandLogoForExport } from "@/lib/brand/load-logo-export";
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

const LOGO_MM = 14;

function drawBrandHeader(
  doc: jsPDF,
  periodLabel: string,
  generatedAt: string,
  logoDataUrl: string
): number {
  const x = PDF_PAGE.margin;
  let y = 14;

  doc.addImage(logoDataUrl, "PNG", x, y - 2, LOGO_MM, LOGO_MM);

  const textX = x + LOGO_MM + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PDF_BRAND_RGB);
  doc.text(site.name, textX, y + 5);

  y += LOGO_MM + 4;
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

export async function downloadReportPdf(payload: ReportPayload): Promise<void> {
  const { dataUrl: logoDataUrl } = await loadBrandLogoForExport();
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

  let y = drawBrandHeader(doc, payload.periodLabel, generatedLabel, logoDataUrl);

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
    doc.addImage(logoDataUrl, "PNG", PDF_PAGE.margin, y - 2, 10, 10);
    y += 12;
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

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${site.name} — Page ${i}/${pageCount}`,
      PDF_PAGE.width - PDF_PAGE.margin,
      289,
      { align: "right" }
    );
  }

  doc.save(reportPdfFilename(payload));
}
