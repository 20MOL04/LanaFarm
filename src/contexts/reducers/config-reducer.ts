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
import type { CategorieDepense, Depense, FarmConfig, Production, Tresorerie, Vente } from "@/types/domain";
import { CATEGORIES_DEPENSES, METHODES_TRESORERIE } from "@/types/domain";
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

export function configReducer(state: State, action: FarmStoreAction): State | undefined {
  switch (action.type) {
case "config/profil/update": {
      const next: FarmConfig = {
        ...state.config,
        profil: { ...state.config.profil, ...action.payload.patch },
      };
      return pushLog(
        { ...state, config: next },
        {
          type: "modification",
          module: "semaine",
          cibleId: "config-profil",
          description: "Profil de la ferme mis à jour.",
        }
      );
    }
    case "config/preferences/update": {
      const next: FarmConfig = {
        ...state.config,
        preferences: { ...state.config.preferences, ...action.payload.patch },
      };
      return pushLog(
        { ...state, config: next },
        {
          type: "modification",
          module: "semaine",
          cibleId: "config-preferences",
          description: "Préférences opérationnelles mises à jour.",
        }
      );
    }
    case "config/seuils/update": {
      const next: FarmConfig = {
        ...state.config,
        seuils: { ...state.config.seuils, ...action.payload.patch },
      };
      return pushLog(
        { ...state, config: next },
        {
          type: "modification",
          module: "semaine",
          cibleId: "config-seuils",
          description: "Seuils & alertes mis à jour.",
        }
      );
    }
    case "config/categorie/update": {
      const { id, patch } = action.payload;
      const exists = state.config.listes.categoriesDepense.some((c) => c.id === id);
      const refLabel = CATEGORIES_DEPENSES.find((c) => c.id === id)?.label;
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          categoriesDepense: exists
            ? state.config.listes.categoriesDepense.map((c) =>
                c.id === id ? { ...c, ...patch } : c
              )
            : [
                ...state.config.listes.categoriesDepense,
                {
                  id,
                  label: patch.label?.trim() || refLabel || id,
                  actif: patch.actif ?? true,
                  isDefault: true,
                },
              ],
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "modification",
          module: "semaine",
          cibleId: `config-categorie-${id}`,
          description: `Catégorie de dépense « ${id} » mise à jour.`,
        }
      );
    }
    case "config/categorie/add": {
      const label = action.payload.label.trim();
      if (!label) return state;
      const labels = state.config.listes.categoriesDepense.map((c) => c.label);
      const match = findClosestMatch(label, labels);
      if (match) {
        return setStoreError(state, {
          code: "CATEGORIE_EXISTE",
          message: `"${match}" existe déjà.`,
        });
      }
      const newItem = {
        id: crypto.randomUUID(),
        label,
        actif: true,
        isDefault: false,
      };
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          categoriesDepense: [...state.config.listes.categoriesDepense, newItem],
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "creation",
          module: "semaine",
          cibleId: `config-categorie-${newItem.id}`,
          description: `Catégorie « ${label} » ajoutée.`,
        }
      );
    }
    case "config/categorie/toggle": {
      const { id } = action.payload;
      const list = state.config.listes.categoriesDepense;
      const item = list.find((c) => c.id === id);
      if (!item) return state;
      if (item.actif) {
        const activeCount = list.filter((c) => c.actif).length;
        if (activeCount <= 1) {
          return setStoreError(state, {
            code: "DERNIERE_CATEGORIE_ACTIVE",
            message: "Au moins une catégorie doit rester active.",
          });
        }
      }
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          categoriesDepense: list.map((c) =>
            c.id === id ? { ...c, actif: !c.actif } : c
          ),
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "modification",
          module: "semaine",
          cibleId: `config-categorie-${id}`,
          description: `Catégorie « ${item.label} » ${item.actif ? "désactivée" : "activée"}.`,
        }
      );
    }
    case "config/methode/update": {
      const { id, patch } = action.payload;
      const list = state.config.listes.methodesPaiement;
      const exists = list.some((m) => m.id === id);
      const refLabel = METHODES_TRESORERIE.find((m) => m.id === id)?.label;
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          methodesPaiement: exists
            ? list.map((m) => (m.id === id ? { ...m, ...patch } : m))
            : [
                ...list,
                {
                  id,
                  label: patch.label?.trim() || refLabel || id,
                  actif: true,
                  isDefault: true,
                },
              ],
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "modification",
          module: "semaine",
          cibleId: `config-methode-${id}`,
          description: `Méthode de paiement « ${id} » mise à jour.`,
        }
      );
    }
    case "config/methode/add": {
      const label = action.payload.label.trim();
      if (!label) return state;
      const labels = state.config.listes.methodesPaiement.map((m) => m.label);
      const match = findClosestMatch(label, labels);
      if (match) {
        return setStoreError(state, {
          code: "METHODE_EXISTE",
          message: `"${match}" existe déjà.`,
        });
      }
      const newItem = {
        id: crypto.randomUUID(),
        label,
        actif: true,
        isDefault: false,
      };
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          methodesPaiement: [...state.config.listes.methodesPaiement, newItem],
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "creation",
          module: "semaine",
          cibleId: `config-methode-${newItem.id}`,
          description: `Méthode « ${label} » ajoutée.`,
        }
      );
    }
    case "config/methode/toggle": {
      const { id } = action.payload;
      const list = state.config.listes.methodesPaiement;
      const item = list.find((m) => m.id === id);
      if (!item) return state;
      if (item.actif) {
        const activeCount = list.filter((m) => m.actif).length;
        if (activeCount <= 1) {
          return setStoreError(state, {
            code: "DERNIERE_METHODE_ACTIVE",
            message: "Au moins une méthode doit rester active.",
          });
        }
      }
      const next: FarmConfig = {
        ...state.config,
        listes: {
          ...state.config.listes,
          methodesPaiement: list.map((m) =>
            m.id === id ? { ...m, actif: !m.actif } : m
          ),
        },
      };
      return pushLog(
        { ...state, config: next, errors: null },
        {
          type: "modification",
          module: "semaine",
          cibleId: `config-methode-${id}`,
          description: `Méthode « ${item.label} » ${item.actif ? "désactivée" : "activée"}.`,
        }
      );
    }
    default:
      return undefined;
  }
}
