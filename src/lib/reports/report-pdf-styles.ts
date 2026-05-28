import type { jsPDF } from "jspdf";
import type { UserOptions } from "jspdf-autotable";

/** Bleu marque LanaFarm (#1d4ed8). */
export const PDF_BRAND_RGB: [number, number, number] = [29, 78, 216];

export const PDF_PAGE = {
  margin: 14,
  width: 210,
} as const;

export const PDF_CONTENT_WIDTH =
  PDF_PAGE.width - PDF_PAGE.margin * 2;

export function pdfTableBase(): Partial<UserOptions> {
  return {
    margin: { left: PDF_PAGE.margin, right: PDF_PAGE.margin },
    tableWidth: PDF_CONTENT_WIDTH,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PDF_BRAND_RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "striped",
  };
}

export function pdfLastTableY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}
