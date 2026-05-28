import type { ExpenseMultiDayBlock } from "@/components/expenses/expenses-multi-day-form";
import { isExpenseBlockFilled } from "@/components/expenses/expenses-multi-day-form";

export type ExpensesPreviewSnapshot = {
  total: number;
  ligneCount: number;
  totalLabel: string;
};

function countLines(blocks: ExpenseMultiDayBlock[]): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const block of blocks) {
    if (!isExpenseBlockFilled(block)) continue;
    for (const l of block.lignes) {
      if (l.categorie.trim() && l.montant > 0) {
        total += l.montant;
        count += 1;
      }
    }
  }
  return { total, count };
}

export function computeExpensesPreview(
  input:
    | { mode: "day"; lignes: { categorie: string; montant: number }[] }
    | { mode: "multi"; blocks: ExpenseMultiDayBlock[] }
): ExpensesPreviewSnapshot {
  if (input.mode === "day") {
    let total = 0;
    let count = 0;
    for (const l of input.lignes) {
      if (l.categorie.trim() && l.montant > 0) {
        total += l.montant;
        count += 1;
      }
    }
    return { total, ligneCount: count, totalLabel: "Total du jour" };
  }
  const { total, count } = countLines(input.blocks);
  return { total, ligneCount: count, totalLabel: "Total période" };
}
