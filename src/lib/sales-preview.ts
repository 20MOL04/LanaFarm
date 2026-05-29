import { startOfDay } from "date-fns";

import type { SalesMultiDayBlock } from "@/components/sales/sales-multi-day-form";
import { isSalesBlockFilled } from "@/components/sales/sales-multi-day-form";
import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import {
  calcSaleLineMontant,
  saleDayUiToStorageDrafts,
  validateSaleDraftWithCumulativeStock,
  type SaleLineUiDraft,
} from "@/lib/sales-calc";
import { stockMagasinInstantane } from "@/lib/lanafarm-core";
import { eggsToTrays, traysToEggs } from "@/lib/units";
import type { TransfertStock, Vente } from "@/types/domain";

export type SalesPreviewSnapshot = {
  stockDisponibleAlv: number;
  stockApresAlv: number;
  deltaAlv: number;
  montantTotal: number;
  stockNegatif: boolean;
  caLabel: string;
  stockDebutLabel?: string;
  stockFinLabel?: string;
};

function isSameCalendarDay(a: string, b: string): boolean {
  return (
    startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime()
  );
}

/**
 * Preview ventes — une source pour 1 jour (lignes + cassés) ou plusieurs jours.
 * Multi-jours : stock vente actuel (aujourd'hui) vs après simulation des lignes saisies.
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
    | { mode: "multi"; blocks: SalesMultiDayBlock[] }
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
      deltaAlv:
        eggsToTrays(stockApres, capacitePlateau) -
        eggsToTrays(stockDisponible, capacitePlateau),
      montantTotal,
      stockNegatif: stockApres < 0,
      caLabel: "CA du jour",
      stockDebutLabel: "Stock vente",
      stockFinLabel: "Après saisie",
    };
  }

  const filled = input.blocks
    .filter(isSalesBlockFilled)
    .sort(
      (a, b) =>
        startOfDay(new Date(a.jourISO)).getTime() -
        startOfDay(new Date(b.jourISO)).getTime()
    );

  if (filled.length === 0) return null;

  const today = startOfDay(new Date());
  const stockActuelOeufs = stockMagasinInstantane(transferts, ventes, today);
  const stockActuelAlv = eggsToTrays(stockActuelOeufs, capacitePlateau);

  let ventesSim = [...ventes];
  let montantTotal = 0;
  let stockNegatif = false;
  let draftIndex = 0;

  for (const block of filled) {
    const jourISO = startOfDay(new Date(block.jourISO)).toISOString();

    // Jour déjà saisi → preview en mode remplacement (comme à l'enregistrement).
    ventesSim = ventesSim.filter(
      (v) =>
        v.statut !== "actif" || !isSameCalendarDay(v.jourISO, block.jourISO)
    );

    const drafts = saleDayUiToStorageDrafts(
      {
        jourISO,
        lignes: block.lignes.filter((l) => l.alveoles > 0),
        oeufsCasses: SHOW_VENTE_CASSES
          ? traysToEggs(block.cassesAlveoles, capacitePlateau)
          : 0,
      },
      capacitePlateau
    );

    for (const draft of drafts) {
      const { errors, stockDisponible } = validateSaleDraftWithCumulativeStock(
        draft,
        {
          transferts,
          toutesVentes: ventesSim,
        }
      );
      const vendus = draft.vendus + draft.cassesVente;
      const stockApresLigne = stockDisponible - vendus;
      if (Object.keys(errors).length > 0 || stockApresLigne < 0) {
        stockNegatif = true;
      }
      montantTotal += calcSaleLineMontant(
        draft.vendus,
        draft.prix,
        capacitePlateau
      );

      ventesSim = [
        ...ventesSim,
        {
          id: `__preview_${jourISO}_${draftIndex}`,
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
      draftIndex += 1;
    }
  }

  const stockApresOeufs = stockMagasinInstantane(transferts, ventesSim, today);
  const stockApresAlv = eggsToTrays(stockApresOeufs, capacitePlateau);
  const deltaAlv = stockApresAlv - stockActuelAlv;

  return {
    stockDisponibleAlv: stockActuelAlv,
    stockApresAlv,
    deltaAlv,
    montantTotal,
    stockNegatif,
    caLabel: "CA saisi",
    stockDebutLabel: "Stock vente",
    stockFinLabel: "Après saisie",
  };
}
