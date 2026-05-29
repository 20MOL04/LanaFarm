import { startOfDay } from "date-fns";

import type { FarmStoreAction, State } from "@/contexts/farm-store";
import { createId } from "@/lib/ids";
import { formatGNF } from "@/lib/format";
import { stockMagasinInstantane } from "@/lib/lanafarm-core";
import { stockFermeDisponiblePourEnvoi } from "@/lib/transfers-calc";
import { computeVenteSnapshot } from "@/lib/sales-calc";
import { eggsToTrays, traysToEggs } from "@/lib/units";
import { findClosestMatch } from "@/lib/fuzzy-match";
import {
  buildDefaultCategoriesDepense,
  buildDefaultMethodesPaiement,
  migrateDepensesCategories,
  migrateConfigMethodesPaiement,
  migrateMethodesTresorerie,
} from "@/lib/config-defaults";
import { KPI_LABEL } from "@/lib/terminology";
import type { CategorieDepense, Depense, Production, Tresorerie, Vente, TransfertStock } from "@/types/domain";
import {
  ARCHIVE_MOTIF_MODIFIE,
  archiveEntry,
  buildAutoTransfert,
  pushLog,
  reconcileTransfertsForProduction,
  resteAVerserGlobal,
  resteAVerserSansEntree,
  setStoreError,
  sharesEntryLineage,
} from "@/contexts/reducers/shared";

export function transfertReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "transfert/confirm": {
      const target = state.transferts.find((t) => t.id === action.payload.id);
      if (!target) return state;
      const now = new Date().toISOString();
      const qte = action.payload.quantiteRecue ?? target.quantiteEnvoyee;
      const ecart = qte - target.quantiteEnvoyee;
      const updated: TransfertStock = {
        ...target,
        statut: "recu",
        quantiteRecue: qte,
        ecart,
        jourReceptionISO: target.jourReceptionISO ?? now,
        noteEcart: ecart !== 0
          ? action.payload.noteEcart ?? target.noteEcart
          : undefined,
        updatedAt: now,
      };
      const s1: State = {
        ...state,
        transferts: state.transferts.map((t) => (t.id === target.id ? updated : t)),
      };
      return pushLog(s1, {
        type: "validation",
        module: "transfert",
        cibleId: target.id,
        description: `Transfert confirmé : ${qte} œufs reçus${ecart !== 0 ? ` (écart ${ecart})` : ""}.`,
      });
    }
    case "transfert/contest": {
      const target = state.transferts.find((t) => t.id === action.payload.id);
      if (!target) return state;
      const now = new Date().toISOString();
      const updated: TransfertStock = {
        ...target,
        statut: "conteste",
        noteEcart: action.payload.noteEcart,
        updatedAt: now,
      };
      const s1: State = {
        ...state,
        transferts: state.transferts.map((t) => (t.id === target.id ? updated : t)),
      };
      return pushLog(s1, {
        type: "modification",
        module: "transfert",
        cibleId: target.id,
        description: `Transfert contesté : ${action.payload.noteEcart}.`,
      });
    }
    case "transfert/addManuel": {
      const { jourISO, quantiteAlveoles, notes } = action.payload;
      const dateRef = startOfDay(new Date(jourISO));
      if (Number.isNaN(dateRef.getTime())) {
        return setStoreError(state, {
          code: "DATE_INVALIDE",
          message: "Date invalide.",
        });
      }
      const jourNormalise = dateRef.toISOString();
      const cap = state.config.preferences.capacitePlateau;
      const quantiteOeufs = traysToEggs(
        Math.max(0, Math.floor(quantiteAlveoles)),
        cap
      );
      if (quantiteOeufs <= 0) {
        return setStoreError(state, {
          code: "QUANTITE_INVALIDE",
          message: "Indiquez au moins 1 alvéole à envoyer.",
        });
      }
      const stockFerme = stockFermeDisponiblePourEnvoi(
        state.productions,
        state.transferts,
        dateRef
      );
      if (quantiteOeufs > stockFerme) {
        const dispoAlv = eggsToTrays(stockFerme, cap);
        return setStoreError(state, {
          code: "STOCK_FERME_INSUFFISANT",
          message: `${KPI_LABEL.stockFerme} insuffisant. Disponible : ${dispoAlv} alv. Demandé : ${Math.floor(quantiteAlveoles)} alv.`,
          meta: { stockFerme, quantiteOeufs, dispoAlv, quantiteAlveoles },
        });
      }
      const now = new Date().toISOString();
      const xfer: TransfertStock = {
        id: createId("xfer"),
        jourEnvoiISO: jourNormalise,
        jourReceptionISO: jourNormalise,
        quantiteEnvoyee: quantiteOeufs,
        quantiteRecue: quantiteOeufs,
        ecart: 0,
        statut: "recu",
        autoConfirm: true,
        noteEcart: notes?.trim() ? notes.trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };
      const s2: State = { ...state, transferts: [xfer, ...state.transferts], errors: null };
      return pushLog(s2, {
        type: "creation",
        module: "transfert",
        cibleId: xfer.id,
        description: `Transfert manuel : ${Math.floor(quantiteAlveoles)} alvéoles envoyées au magasin.`,
      });
    }
    default:
      return undefined;
  }
}
