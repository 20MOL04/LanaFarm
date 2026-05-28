import { startOfDay } from "date-fns";

import {
  calcSaleLineMontant,
  saleDayUiToStorageDrafts,
  validateSaleDraftWithCumulativeStock,
  type SaleLineUiDraft,
} from "@/lib/sales-calc";
import { stockMagasinInstantane } from "@/lib/lanafarm-core";
import { eggsToTrays, traysToEggs } from "@/lib/units";
import type { TransfertStock, Vente } from "@/types/domain";

import type { SalesMultiDayLine } from "@/components/sales/sales-multi-day-form";

export type SalesPreviewSnapshot = {
  stockDisponibleAlv: number;
  stockApresAlv: number;
  deltaAlv: number;
  montantTotal: number;
  stockNegatif: boolean;
  caLabel: string;
};

function isLineFilled(line: SalesMultiDayLine): boolean {
  return line.alveoles > 0;
}

/**
 * Preview ventes — une source pour 1 jour (lignes + cassés) ou plusieurs jours.
 */
export function computeSalesPreview(
  ventes: Vente[],
  transferts: TransfertStock[],
  capacitePlateau: number,
  input:
    | {
        mode: "day";
        dayDate: Date | null;
        lignes: SaleLineUiDraft[];
        cassesAlveoles: number;
      }
    | { mode: "multi"; lines: SalesMultiDayLine[] }
): SalesPreviewSnapshot | null {
  if (input.mode === "day") {
    if (!input.dayDate) return null;

    const stockDisponible = stockMagasinInstantane(
      transferts,
      ventes,
      input.dayDate
    );
    let alveolesTotales = 0;
    let montantTotal = 0;
    for (const l of input.lignes) {
      if (l.alveoles <= 0) continue;
      alveolesTotales += l.alveoles;
      montantTotal += l.alveoles * l.prix;
    }
    const sortieOeufs =
      traysToEggs(alveolesTotales, capacitePlateau) +
      traysToEggs(input.cassesAlveoles, capacitePlateau);
    const stockApres = stockDisponible - sortieOeufs;

    return {
      stockDisponibleAlv: eggsToTrays(stockDisponible, capacitePlateau),
      stockApresAlv: eggsToTrays(Math.max(0, stockApres), capacitePlateau),
      deltaAlv: eggsToTrays(stockApres, capacitePlateau) - eggsToTrays(stockDisponible, capacitePlateau),
      montantTotal,
      stockNegatif: stockApres < 0,
      caLabel: "CA du jour",
    };
  }

  const filled = input.lines
    .filter(isLineFilled)
    .sort(
      (a, b) =>
        startOfDay(new Date(a.jourISO)).getTime() -
        startOfDay(new Date(b.jourISO)).getTime()
    );

  if (filled.length === 0) return null;

  let ventesSim = [...ventes];
  let montantTotal = 0;
  let stockNegatif = false;
  let firstStockAlv = 0;
  let lastStockApresAlv = 0;

  for (let i = 0; i < filled.length; i++) {
    const line = filled[i]!;
    const jourISO = startOfDay(new Date(line.jourISO)).toISOString();
    const drafts = saleDayUiToStorageDrafts(
      {
        jourISO,
        lignes: [{ alveoles: line.alveoles, prix: line.prix, client: line.client }],
        oeufsCasses: traysToEggs(line.cassesAlveoles, capacitePlateau),
      },
      capacitePlateau
    );

    for (const draft of drafts) {
      const { errors, stockDisponible } = validateSaleDraftWithCumulativeStock(draft, {
        transferts,
        toutesVentes: ventesSim,
      });
      const vendus = draft.vendus + draft.cassesVente;
      const stockApres = stockDisponible - vendus;
      if (i === 0 && drafts.indexOf(draft) === 0) {
        firstStockAlv = eggsToTrays(stockDisponible, capacitePlateau);
      }
      lastStockApresAlv = eggsToTrays(Math.max(0, stockApres), capacitePlateau);
      if (Object.keys(errors).length > 0 || stockApres < 0) stockNegatif = true;
      montantTotal += calcSaleLineMontant(draft.vendus, draft.prix, capacitePlateau);

      ventesSim = [
        ...ventesSim,
        {
          id: `__preview_${jourISO}_${i}`,
          jourISO: draft.jourISO,
          vendus: draft.vendus,
          cassesVente: draft.cassesVente,
          prix: draft.prix,
          client: draft.client,
          statut: "actif" as const,
          montant: calcSaleLineMontant(draft.vendus, draft.prix, capacitePlateau),
          createdAt: "",
          updatedAt: "",
        } as Vente,
      ];
    }
  }

  return {
    stockDisponibleAlv: firstStockAlv,
    stockApresAlv: lastStockApresAlv,
    deltaAlv: lastStockApresAlv - firstStockAlv,
    montantTotal,
    stockNegatif,
    caLabel: "CA période",
  };
}
