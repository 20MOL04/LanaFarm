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

export function tresorerieReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "tresorerie/add": {
      const depose = Math.max(0, Math.floor(action.payload.draft.depose));
      const reste = resteAVerserGlobal(state);
      if (depose > reste) {
        return setStoreError(state, {
          code: "VERSEMENT_DEPASSE_RESTE",
          message: "Le versement dépasse le reste à verser.",
          meta: { reste, depose },
        });
      }
      const now = new Date().toISOString();
      const entryId = createId("tresorerie");
      const entry: Tresorerie = {
        id: entryId,
        ...action.payload.draft,
        reste: action.payload.draft.montantRecu - action.payload.draft.depose,
        statut: "actif",
        lineageId: entryId,
        createdAt: now,
        updatedAt: now,
      };
      const s2: State = { ...state, tresorerie: [entry, ...state.tresorerie] };
      return pushLog(s2, {
        type: "creation",
        module: "tresorerie",
        cibleId: entry.id,
        description: `Trésorerie ${entry.methode} : ${formatGNF(entry.depose)} / ${formatGNF(entry.montantRecu)}.`,
      });
    }
    case "tresorerie/addDay": {
      const { jourISO, lignes } = action.payload;
      const candidates = lignes.filter(
        (l) => l.methode.trim().length > 0 || l.montantRecu > 0
      );
      if (candidates.length === 0) return state;

      const invalid = candidates.some(
        (l) =>
          !l.methode.trim() ||
          !Number.isFinite(l.montantRecu) ||
          l.montantRecu <= 0
      );
      if (invalid) {
        return setStoreError(state, {
          code: "TRESORERIE_BATCH_INVALID",
          message:
            "Chaque ligne doit avoir une méthode et un montant reçu supérieur à 0.",
        });
      }

      const now = new Date().toISOString();
      const normalized = candidates.map((l) => {
        const montantRecu = Math.max(0, Math.floor(l.montantRecu));
        return {
          methode: l.methode.trim(),
          montantRecu,
          depose: montantRecu,
          note: l.note?.trim() ? l.note.trim() : undefined,
        };
      });

      const total = normalized.reduce((sum, l) => sum + l.montantRecu, 0);
      const reste = resteAVerserGlobal(state);
      if (total > reste) {
        return setStoreError(state, {
          code: "VERSEMENT_DEPASSE_RESTE",
          message: "Le versement dépasse le reste à verser.",
          meta: { reste, depose: total },
        });
      }

      const entries: Tresorerie[] = normalized.map((l) => {
        const entryId = createId("tresorerie");
        return {
          id: entryId,
          jourISO,
          montantRecu: l.montantRecu,
          depose: l.depose,
          reste: 0,
          methode: l.methode,
          note: l.note,
          statut: "actif" as const,
          lineageId: entryId,
          createdAt: now,
          updatedAt: now,
        };
      });

      const s2: State = {
        ...state,
        errors: null,
        tresorerie: [...entries, ...state.tresorerie],
      };
      return pushLog(s2, {
        type: "creation",
        module: "tresorerie",
        cibleId: entries[0]?.id ?? "batch",
        description: `${entries.length} versement(s) — ${formatGNF(total)}.`,
      });
    }
    case "tresorerie/update": {
      const target = state.tresorerie.find((d) => d.id === action.payload.id);
      if (!target || target.statut !== "actif") return state;
      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Tresorerie>(
        "tresorerie",
        target,
        action.payload.patch,
        now,
        "tresorerie"
      );
      const updated: Tresorerie = {
        ...merged,
        reste: merged.montantRecu - merged.depose,
      };
      const depose = Math.max(0, Math.floor(updated.depose));
      const reste = resteAVerserSansEntree(state, target.id);
      if (depose > reste) {
        return setStoreError(state, {
          code: "VERSEMENT_DEPASSE_RESTE",
          message: "Le versement dépasse le reste à verser.",
          meta: { reste, depose },
        });
      }
      let s1: State = {
        ...state,
        errors: null,
        tresorerie: [
          ...(archived ? [archived] : []),
          ...state.tresorerie.map((d) => (d.id === target.id ? updated : d)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "tresorerie",
          cibleId: target.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "modification",
        module: "tresorerie",
        cibleId: target.id,
        description: `Mise à jour trésorerie.`,
      });
    }
    case "tresorerie/cancel": {
      const target = state.tresorerie.find((d) => d.id === action.payload.id);
      if (!target || target.statut === "annule") return state;
      const updated: Tresorerie = { ...target, statut: "annule", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        tresorerie: state.tresorerie.map((d) => (d.id === target.id ? updated : d)),
      };
      return pushLog(s1, {
        type: "annulation",
        module: "tresorerie",
        cibleId: target.id,
        description: `Saisie trésorerie annulée (soft-delete).`,
      });
    }
    case "tresorerie/restore": {
      const target = state.tresorerie.find((d) => d.id === action.payload.id);
      if (!target || target.statut === "actif") return state;
      const updated: Tresorerie = { ...target, statut: "actif", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        tresorerie: state.tresorerie.map((d) => (d.id === target.id ? updated : d)),
      };
      return pushLog(s1, {
        type: "restauration",
        module: "tresorerie",
        cibleId: target.id,
        description: `Saisie trésorerie restaurée.`,
      });
    }
    case "tresorerie/restoreVersion": {
      const active = state.tresorerie.find((d) => d.id === action.payload.activeId);
      const archive = state.tresorerie.find((d) => d.id === action.payload.archiveId);
      if (!active || active.statut !== "actif") return state;
      if (!archive || !sharesEntryLineage(active, archive)) return state;

      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Tresorerie>(
        "tresorerie",
        active,
        {
          montantRecu: archive.montantRecu,
          depose: archive.depose,
          methode: archive.methode,
          note: archive.note,
        },
        now,
        "tresorerie"
      );
      const updated: Tresorerie = {
        ...merged,
        reste: merged.montantRecu - merged.depose,
      };
      let s1: State = {
        ...state,
        tresorerie: [
          ...(archived ? [archived] : []),
          ...state.tresorerie.map((d) => (d.id === active.id ? updated : d)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "tresorerie",
          cibleId: active.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "restauration",
        module: "tresorerie",
        cibleId: active.id,
        description: `Restauration d'une version archivée.`,
      });
    }
    default:
      return undefined;
  }
}
