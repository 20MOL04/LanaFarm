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
import type { CategorieDepense, Depense, Production, Tresorerie, Vente } from "@/types/domain";
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

export function venteReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "vente/add": {
      const cap = state.config.preferences.capacitePlateau;
      const dateRef = startOfDay(new Date(action.payload.draft.jourISO));
      const stockDisponible = stockMagasinInstantane(
        state.transferts,
        state.ventes,
        dateRef
      );
      const quantiteDemandee =
        action.payload.draft.vendus + Math.max(0, action.payload.draft.cassesVente ?? 0);
      if (quantiteDemandee > stockDisponible) {
        return setStoreError(state, {
          code: "STOCK_INSUFFISANT",
          message: `Stock insuffisant. Disponible : ${eggsToTrays(stockDisponible, cap)} alv. Demandé : ${eggsToTrays(quantiteDemandee, cap)} alv.`,
          meta: {
            stockDisponible,
            quantiteDemandee,
            stockDisponibleAlv: eggsToTrays(stockDisponible, cap),
            quantiteDemandeeAlv: eggsToTrays(quantiteDemandee, cap),
          },
        });
      }

      const s1SansErreur: State = state.errors ? { ...state, errors: null } : state;
      const now = new Date().toISOString();
      const snapshot = computeVenteSnapshot(
        action.payload.draft,
        s1SansErreur.productions,
        s1SansErreur.ventes,
        cap
      );
      const entryId = createId("vente");
      const entry: Vente = {
        id: entryId,
        ...action.payload.draft,
        recuFerme: snapshot.recuFerme,
        resteVente: snapshot.resteVente,
        montant: snapshot.montant,
        statut: "actif",
        lineageId: entryId,
        createdAt: now,
        updatedAt: now,
      };
      const s2: State = { ...s1SansErreur, ventes: [entry, ...s1SansErreur.ventes] };
      const alv = eggsToTrays(entry.vendus, cap);
      return pushLog(s2, {
        type: "creation",
        module: "vente",
        cibleId: entry.id,
        description: `Saisie vente : ${alv} alvéoles à ${formatGNF(entry.prix)}/casier.`,
      });
    }
    case "vente/addDay": {
      const drafts = action.payload.drafts.filter((d) => d.vendus > 0);
      if (drafts.length === 0) return state;
      const cap = state.config.preferences.capacitePlateau;
      const dateRef = startOfDay(new Date(drafts[0].jourISO));
      const stockDisponible = stockMagasinInstantane(
        state.transferts,
        state.ventes,
        dateRef
      );
      const quantiteTotaleBatch = drafts.reduce(
        (sum, d) => sum + d.vendus + Math.max(0, d.cassesVente ?? 0),
        0
      );
      if (quantiteTotaleBatch > stockDisponible) {
        return setStoreError(state, {
          code: "STOCK_INSUFFISANT_BATCH",
          message: `Stock insuffisant pour ce lot. Disponible : ${eggsToTrays(stockDisponible, cap)} alv. Lot total : ${eggsToTrays(quantiteTotaleBatch, cap)} alv.`,
          meta: {
            stockDisponible,
            quantiteTotaleBatch,
            stockDisponibleAlv: eggsToTrays(stockDisponible, cap),
            quantiteTotaleBatchAlv: eggsToTrays(quantiteTotaleBatch, cap),
            nombreLignes: drafts.length,
          },
        });
      }

      const s1SansErreur: State = state.errors ? { ...state, errors: null } : state;
      const now = new Date().toISOString();
      const entries: Vente[] = [];
      const accumulated: Vente[] = [...s1SansErreur.ventes];

      for (const draft of drafts) {
        const snapshot = computeVenteSnapshot(
          draft,
          s1SansErreur.productions,
          accumulated,
          cap
        );
        const entryId = createId("vente");
        const entry: Vente = {
          id: entryId,
          ...draft,
          recuFerme: snapshot.recuFerme,
          resteVente: snapshot.resteVente,
          montant: snapshot.montant,
          statut: "actif",
          lineageId: entryId,
          createdAt: now,
          updatedAt: now,
        };
        entries.push(entry);
        accumulated.unshift(entry);
      }

      const s2: State = { ...s1SansErreur, ventes: [...entries, ...s1SansErreur.ventes] };
      const alvTotal = eggsToTrays(
        entries.reduce((sum, e) => sum + e.vendus, 0),
        cap
      );
      const caTotal = entries.reduce((sum, e) => sum + e.montant, 0);
      return pushLog(s2, {
        type: "creation",
        module: "vente",
        cibleId: entries[0].id,
        description: `Ventes du jour : ${alvTotal} alvéoles — CA ${formatGNF(caTotal)} (${entries.length} ligne${entries.length > 1 ? "s" : ""}).`,
      });
    }
    case "vente/update": {
      const target = state.ventes.find((v) => v.id === action.payload.id);
      if (!target || target.statut !== "actif") return state;
      const cap = state.config.preferences.capacitePlateau;
      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Vente>(
        "vente",
        target,
        action.payload.patch,
        now,
        "vente"
      );
      const autres = state.ventes.filter((v) => v.id !== target.id);
      const snapshot = computeVenteSnapshot(
        {
          jourISO: merged.jourISO,
          vendus: merged.vendus,
          cassesVente: merged.cassesVente,
          prix: merged.prix,
        },
        state.productions,
        autres,
        cap
      );
      const updated: Vente = {
        ...merged,
        recuFerme: snapshot.recuFerme,
        resteVente: snapshot.resteVente,
        montant: snapshot.montant,
      };
      let s1: State = {
        ...state,
        ventes: [
          ...(archived ? [archived] : []),
          ...state.ventes.map((v) => (v.id === target.id ? updated : v)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "vente",
          cibleId: target.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "modification",
        module: "vente",
        cibleId: target.id,
        description: `Mise à jour de la saisie vente.`,
      });
    }
    case "vente/cancel": {
      const target = state.ventes.find((v) => v.id === action.payload.id);
      if (!target || target.statut === "annule") return state;
      const updated: Vente = { ...target, statut: "annule", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        ventes: state.ventes.map((v) => (v.id === target.id ? updated : v)),
      };
      return pushLog(s1, {
        type: "annulation",
        module: "vente",
        cibleId: target.id,
        description: `Saisie vente annulée (soft-delete).`,
      });
    }
    case "vente/restore": {
      const target = state.ventes.find((v) => v.id === action.payload.id);
      if (!target || target.statut === "actif") return state;
      const updated: Vente = { ...target, statut: "actif", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        ventes: state.ventes.map((v) => (v.id === target.id ? updated : v)),
      };
      return pushLog(s1, {
        type: "restauration",
        module: "vente",
        cibleId: target.id,
        description: `Saisie vente restaurée.`,
      });
    }
    case "vente/restoreVersion": {
      const active = state.ventes.find((v) => v.id === action.payload.activeId);
      const archive = state.ventes.find((v) => v.id === action.payload.archiveId);
      if (!active || active.statut !== "actif") return state;
      if (!archive || !sharesEntryLineage(active, archive)) return state;

      const cap = state.config.preferences.capacitePlateau;
      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Vente>(
        "vente",
        active,
        {
          vendus: archive.vendus,
          cassesVente: archive.cassesVente,
          prix: archive.prix,
          client: archive.client,
        },
        now,
        "vente"
      );
      const autres = state.ventes.filter((v) => v.id !== active.id);
      const snapshot = computeVenteSnapshot(
        {
          jourISO: merged.jourISO,
          vendus: merged.vendus,
          cassesVente: merged.cassesVente,
          prix: merged.prix,
        },
        state.productions,
        autres,
        cap
      );
      const updated: Vente = {
        ...merged,
        recuFerme: snapshot.recuFerme,
        resteVente: snapshot.resteVente,
        montant: snapshot.montant,
      };
      let s1: State = {
        ...state,
        ventes: [
          ...(archived ? [archived] : []),
          ...state.ventes.map((v) => (v.id === active.id ? updated : v)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "vente",
          cibleId: active.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "restauration",
        module: "vente",
        cibleId: active.id,
        description: `Restauration d'une version archivée.`,
      });
    }
    default:
      return undefined;
  }
}
