import { startOfDay } from "date-fns";

import {
  calcAlveolesRestantesJour,
  productionUiToStorageDraft,
  type ProductionUiDraft,
} from "@/lib/production-calc";
import { stockFermeDisponiblePourEnvoi } from "@/lib/transfers-calc";
import { eggsToTrays } from "@/lib/units";
import type { Production, TransfertStock } from "@/types/domain";

import type { ProductionMultiDayLine } from "@/components/production/production-multi-day-form";

export type ProductionPreviewSnapshot = {
  restantesJour: number;
  stockAvant: number;
  stockApres: number;
  restantesLabel: string;
};

function isLineFilled(line: ProductionMultiDayLine): boolean {
  return line.alveolesRamassees > 0 || line.alveolesMisesEnVente > 0;
}

/**
 * Preview production — une source pour 1 jour (draft) ou plusieurs jours (lignes).
 */
export function computeProductionPreview(
  productions: Production[],
  transferts: TransfertStock[],
  capacitePlateau: number,
  input:
    | {
        mode: "day";
        draft: ProductionUiDraft;
        dayDate: Date | null;
        editEntryId?: string;
      }
    | { mode: "multi"; lines: ProductionMultiDayLine[] }
): ProductionPreviewSnapshot {
  const today = new Date();
  const stockAvantOeufs = stockFermeDisponiblePourEnvoi(
    productions,
    transferts,
    today
  );

  let productionsSim = productions.filter((p) => p.statut === "actif");
  let restantesJour = 0;
  let restantesLabel = "Restantes ce jour";

  if (input.mode === "day") {
    const { draft, dayDate, editEntryId } = input;
    const eggsProd = productionUiToStorageDraft(draft, capacitePlateau);
    restantesJour = calcAlveolesRestantesJour(
      {
        production: eggsProd.production,
        envoyesVente: eggsProd.envoyesVente,
      },
      capacitePlateau
    );

    const jourKey = dayDate ? startOfDay(dayDate).getTime() : null;
    const hasValues = draft.alveolesRamassees > 0 || draft.alveolesMisesEnVente > 0;

    if (editEntryId && jourKey != null && hasValues) {
      productionsSim = productionsSim.map((p) =>
        p.id === editEntryId
          ? {
              ...p,
              jourISO: dayDate!.toISOString(),
              production: eggsProd.production,
              casses: eggsProd.casses,
              envoyesVente: eggsProd.envoyesVente,
            }
          : p
      );
    } else if (jourKey != null && hasValues) {
      productionsSim = productionsSim.filter(
        (p) => startOfDay(new Date(p.jourISO)).getTime() !== jourKey
      );
      productionsSim = [
        ...productionsSim,
        {
          id: "__preview__",
          jourISO: dayDate!.toISOString(),
          production: eggsProd.production,
          casses: eggsProd.casses,
          envoyesVente: eggsProd.envoyesVente,
          statut: "actif" as const,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }
  } else {
    restantesLabel = "Restantes (lignes saisies)";
    const filled = input.lines
      .filter(isLineFilled)
      .sort(
        (a, b) =>
          startOfDay(new Date(a.jourISO)).getTime() -
          startOfDay(new Date(b.jourISO)).getTime()
      );

    for (const line of filled) {
      const storage = productionUiToStorageDraft(
        {
          jourISO: line.jourISO,
          alveolesRamassees: line.alveolesRamassees,
          alveolesMisesEnVente: line.alveolesMisesEnVente,
          oeufsCasses: line.oeufsCasses,
        },
        capacitePlateau
      );
      restantesJour += calcAlveolesRestantesJour(
        {
          production: storage.production,
          envoyesVente: storage.envoyesVente,
        },
        capacitePlateau
      );

      const jourKey = startOfDay(new Date(line.jourISO)).getTime();
      productionsSim = productionsSim.filter(
        (p) => startOfDay(new Date(p.jourISO)).getTime() !== jourKey
      );
      productionsSim = [
        ...productionsSim,
        {
          id: `__preview_${jourKey}`,
          jourISO: startOfDay(new Date(line.jourISO)).toISOString(),
          production: storage.production,
          casses: storage.casses,
          envoyesVente: storage.envoyesVente,
          statut: "actif" as const,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }
  }

  const stockApresOeufs = stockFermeDisponiblePourEnvoi(
    productionsSim,
    transferts,
    today
  );

  return {
    restantesJour,
    stockAvant: eggsToTrays(stockAvantOeufs, capacitePlateau),
    stockApres: eggsToTrays(stockApresOeufs, capacitePlateau),
    restantesLabel,
  };
}
