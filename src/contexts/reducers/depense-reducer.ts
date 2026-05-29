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

export function depenseReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "depense/add": {
      const now = new Date().toISOString();
      const entryId = createId("dep");
      const entry: Depense = {
        id: entryId,
        ...action.payload.draft,
        statut: "actif",
        lineageId: entryId,
        createdAt: now,
        updatedAt: now,
      };
      const s2: State = { ...state, depenses: [entry, ...state.depenses] };
      return pushLog(s2, {
        type: "creation",
        module: "depense",
        cibleId: entry.id,
        description: `Dépense ${entry.categorie} : ${formatGNF(entry.montant)}.`,
      });
    }
    case "depense/addDay": {
      const { jourISO, lignes } = action.payload;
      const candidates = lignes.filter(
        (l) => l.categorie.trim().length > 0 || l.montant > 0
      );
      if (candidates.length === 0) return state;

      const invalid = candidates.some(
        (l) =>
          !l.categorie.trim() ||
          !Number.isFinite(l.montant) ||
          l.montant <= 0
      );
      if (invalid) {
        return setStoreError(state, {
          code: "DEPENSE_BATCH_INVALID",
          message:
            "Chaque ligne doit avoir une catégorie et un montant supérieur à 0.",
        });
      }

      const now = new Date().toISOString();
      const normalized = candidates.map((l) => ({
        categorie: l.categorie.trim(),
        montant: Math.max(0, Math.floor(l.montant)),
        description: l.description?.trim() ? l.description.trim() : undefined,
      }));

      const entries: Depense[] = normalized.map((l) => {
        const entryId = createId("dep");
        return {
          id: entryId,
          jourISO,
          categorie: l.categorie,
          montant: l.montant,
          description: l.description,
          statut: "actif" as const,
          lineageId: entryId,
          createdAt: now,
          updatedAt: now,
        };
      });

      const total = normalized.reduce((sum, l) => sum + l.montant, 0);
      const s2: State = {
        ...state,
        errors: null,
        depenses: [...entries, ...state.depenses],
      };
      return pushLog(s2, {
        type: "creation",
        module: "depense",
        cibleId: entries[0]?.id ?? "batch",
        description: `${entries.length} dépense(s) — ${formatGNF(total)}.`,
      });
    }
    case "depense/update": {
      const target = state.depenses.find((d) => d.id === action.payload.id);
      if (!target || target.statut !== "actif") return state;
      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Depense>(
        "depense",
        target,
        action.payload.patch,
        now,
        "dep"
      );
      const updated: Depense = merged;
      let s1: State = {
        ...state,
        depenses: [
          ...(archived ? [archived] : []),
          ...state.depenses.map((d) => (d.id === target.id ? updated : d)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "depense",
          cibleId: target.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "modification",
        module: "depense",
        cibleId: target.id,
        description: `Mise à jour de la dépense.`,
      });
    }
    case "depense/cancel": {
      const target = state.depenses.find((d) => d.id === action.payload.id);
      if (!target || target.statut === "annule") return state;
      const updated: Depense = { ...target, statut: "annule", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        depenses: state.depenses.map((d) => (d.id === target.id ? updated : d)),
      };
      return pushLog(s1, {
        type: "annulation",
        module: "depense",
        cibleId: target.id,
        description: `Dépense annulée (soft-delete).`,
      });
    }
    case "depense/restore": {
      const target = state.depenses.find((d) => d.id === action.payload.id);
      if (!target || target.statut === "actif") return state;
      const updated: Depense = { ...target, statut: "actif", updatedAt: new Date().toISOString() };
      const s1: State = {
        ...state,
        depenses: state.depenses.map((d) => (d.id === target.id ? updated : d)),
      };
      return pushLog(s1, {
        type: "restauration",
        module: "depense",
        cibleId: target.id,
        description: `Dépense restaurée.`,
      });
    }
    case "depense/restoreVersion": {
      const active = state.depenses.find((d) => d.id === action.payload.activeId);
      const archive = state.depenses.find((d) => d.id === action.payload.archiveId);
      if (!active || active.statut !== "actif") return state;
      if (!archive || !sharesEntryLineage(active, archive)) return state;

      const now = new Date().toISOString();
      const { shouldArchive, archived, merged } = archiveEntry<Depense>(
        "depense",
        active,
        {
          categorie: archive.categorie,
          montant: archive.montant,
          description: archive.description,
        },
        now,
        "dep"
      );
      const updated: Depense = merged;
      let s1: State = {
        ...state,
        depenses: [
          ...(archived ? [archived] : []),
          ...state.depenses.map((d) => (d.id === active.id ? updated : d)),
        ],
      };
      if (shouldArchive) {
        s1 = pushLog(s1, {
          type: "archivage",
          module: "depense",
          cibleId: active.id,
          description: `Version archivée (${ARCHIVE_MOTIF_MODIFIE}).`,
        });
      }
      return pushLog(s1, {
        type: "restauration",
        module: "depense",
        cibleId: active.id,
        description: `Restauration d'une version archivée.`,
      });
    }
    default:
      return undefined;
  }
}
