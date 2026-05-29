import type { FarmStoreAction, State } from "@/contexts/farm-store";
import { setStoreError } from "@/contexts/reducers/shared";
import { configReducer } from "@/contexts/reducers/config-reducer";
import { depenseReducer } from "@/contexts/reducers/depense-reducer";
import { productionReducer } from "@/contexts/reducers/production-reducer";
import { transfertReducer } from "@/contexts/reducers/transfert-reducer";
import { tresorerieReducer } from "@/contexts/reducers/tresorerie-reducer";
import { venteReducer } from "@/contexts/reducers/vente-reducer";

const moduleReducers = [
  productionReducer,
  venteReducer,
  depenseReducer,
  tresorerieReducer,
  transfertReducer,
  configReducer,
];

export function farmStoreReducer(state: State, action: FarmStoreAction): State {
  for (const reduce of moduleReducers) {
    const next = reduce(state, action);
    if (next !== undefined) return next;
  }

  switch (action.type) {
case "farm/bootstrap":
      return {
        ...state,
        productions: action.payload.productions,
        ventes: action.payload.ventes,
        depenses: action.payload.depenses,
        tresorerie: action.payload.tresorerie,
        transferts: action.payload.transferts,
        actions: action.payload.actions,
        config: action.payload.config,
        errors: null,
      };

    case "notifications/hydrate":
      return { ...state, notifications: action.payload.items };

    case "notifications/set":
      return { ...state, notifications: action.payload.items };

    case "notifications/markRead": {
      const { id, readAt } = action.payload;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, readAt } : n
        ),
      };
    }

    case "notifications/dismiss": {
      const { id, dismissedAt } = action.payload;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, dismissedAt } : n
        ),
      };
    }

    case "store/setError":
      return setStoreError(state, action.payload);

    case "store/clearError":
      return state.errors ? { ...state, errors: null } : state;

    default:
      return state;
  }
}
