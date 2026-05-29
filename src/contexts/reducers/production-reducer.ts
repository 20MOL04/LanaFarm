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

export function productionReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "production/add": {
      const jourNormalise = startOfDay(
        new Date(action.payload.draft.jourISO)
      ).toISOString();

      const jourKey = startOfDay(new Date(jourNormalise)).getTime();
      const existante = state.productions.find(
        (p) =>
          p.statut === "actif" &&
          startOfDay(new Date(p.jourISO)).getTime() === jourKey
      );
      if (existante) {
        return setStoreError(state, {
          code: "PRODUCTION_DAY_EXISTS",
          message:
            'Production déjà saisie pour ce jour. Utilisez "Modifier" pour corriger l\'entrée existante.',
          meta: { existingId: existante.id, existingDate: jourNormalise },
        });
      }

      const s1SansErreur: State = state.errors ? { ...state, errors: null } : state;
      const now = new Date().toISOString();
      const entryId = createId("prod");
      const entry: Production = {
        id: entryId,
        ...action.payload.draft,
        jourISO: jourNormalise,
        statut: "actif",
        lineageId: entryId,
        createdAt: now,
        updatedAt: now,
      };
      let s2: State = { ...s1SansErreur, productions: [entry, ...s1SansErreur.productions] };
      // Phase B : matérialise le transfert auto (mono-site V1).
      if (entry.envoyesVente > 0) {
        const xfer = buildAutoTransfert(entry, now);
        s2 = { ...s2, transferts: [xfer, ...s2.transferts] };
        s2 = pushLog(s2, {
          type: "creation",
          module: "transfert",
          cibleId: xfer.id,
          description: `Transfert auto : ${xfer.quantiteEnvoyee} œufs envoyés au magasin.`,
        });
      }
      return pushLog(s2, {
        type: "creation",
        module: "production",
        cibleId: entry.id,
        description: `Saisie production : ${eggsToTrays(entry.production)} alvéoles ramassées.`,
      });
    }
    case "production/update": {
      const target = state.productions.find((p) => p.id === action.payload.id);
      if (!target || target.statut !== "actif") return state;
      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Production>(
        "production",
        target,
        action.payload.patch,
        now,
        "prod"
      );
      const updated: Production = merged;
      let s1: State = {
        ...state,
        productions: [
          ...(archived ? [archived] : []),
          ...state.productions.map((p) => (p.id === target.id ? updated : p)),
        ],
      };
      const envoyesChanged = target.envoyesVente !== updated.envoyesVente;
      const dayChanged = target.jourISO !== updated.jourISO;
      if (envoyesChanged || dayChanged) {
        s1 = reconcileTransfertsForProduction(s1, updated, now, "update");
      }
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "production",
          cibleId: target.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "modification",
        module: "production",
        cibleId: target.id,
        description: `Mise à jour de la saisie production.`,
      });
    }
    case "production/cancel": {
      const target = state.productions.find((p) => p.id === action.payload.id);
      if (!target || target.statut === "annule") return state;
      const now = new Date().toISOString();
      const updated: Production = { ...target, statut: "annule", updatedAt: now };
      let s1: State = {
        ...state,
        productions: state.productions.map((p) => (p.id === target.id ? updated : p)),
      };
      s1 = reconcileTransfertsForProduction(s1, updated, now, "cancel");
      return pushLog(s1, {
        type: "annulation",
        module: "production",
        cibleId: target.id,
        description: `Saisie production annulée (soft-delete).`,
      });
    }
    case "production/restore": {
      const target = state.productions.find((p) => p.id === action.payload.id);
      if (!target || target.statut === "actif") return state;
      const now = new Date().toISOString();
      const updated: Production = { ...target, statut: "actif", updatedAt: now };
      let s1: State = {
        ...state,
        productions: state.productions.map((p) => (p.id === target.id ? updated : p)),
      };
      s1 = reconcileTransfertsForProduction(s1, updated, now, "restore");
      return pushLog(s1, {
        type: "restauration",
        module: "production",
        cibleId: target.id,
        description: `Saisie production restaurée.`,
      });
    }
    case "production/restoreVersion": {
      const active = state.productions.find((p) => p.id === action.payload.activeId);
      const archive = state.productions.find((p) => p.id === action.payload.archiveId);
      if (!active || active.statut !== "actif") return state;
      if (!archive || !sharesEntryLineage(active, archive)) return state;

      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Production>(
        "production",
        active,
        {
          production: archive.production,
          casses: archive.casses,
          envoyesVente: archive.envoyesVente,
          notes: archive.notes,
        },
        now,
        "prod"
      );
      const updated: Production = merged;
      let s1: State = {
        ...state,
        productions: [
          ...(archived ? [archived] : []),
          ...state.productions.map((p) => (p.id === active.id ? updated : p)),
        ],
      };
      const envoyesChanged = active.envoyesVente !== updated.envoyesVente;
      const dayChanged = active.jourISO !== updated.jourISO;
      if (envoyesChanged || dayChanged) {
        s1 = reconcileTransfertsForProduction(s1, updated, now, "update");
      }
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "production",
          cibleId: active.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "restauration",
        module: "production",
        cibleId: active.id,
        description: `Restauration d'une version archivée.`,
      });
    }
    default:
      return undefined;
  }
}
