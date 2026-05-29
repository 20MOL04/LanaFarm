"use client";

/**
 * Farm Store — état unifié de la ferme.
 *
 * Centralise productions + ventes + semaines + journal d'actions.
 * Permet aux modules de partager des données (ex : Sales consomme Production
 * pour calculer le "Reçu Ferme" automatiquement) et garantit qu'une semaine
 * validée verrouille TOUS les modules de cette semaine.
 *
 * Compatibilité :
 *  - `useProductionStore()` conserve sa signature publique antérieure.
 *  - `useSalesStore()` expose les mêmes patterns côté Ventes.
 *
 * Sera remplacé par Supabase ultérieurement ; les hooks ne changeront pas.
 */

import * as React from "react";
import { addDays, eachDayOfInterval, startOfDay, startOfMonth } from "date-fns";

import { createId } from "@/lib/ids";
import {
  buildDefaultCategoriesDepense,
  buildDefaultMethodesPaiement,
  DEFAULT_FARM_CONFIG,
  migrateDepensesCategories,
  migrateConfigMethodesPaiement,
  migrateMethodesTresorerie,
} from "@/lib/config-defaults";
import { findClosestMatch } from "@/lib/fuzzy-match";
import { formatGNF } from "@/lib/format";
import { stockMagasinInstantane } from "@/lib/lanafarm-core";
import { stockFermeDisponiblePourEnvoi } from "@/lib/transfers-calc";

export { stockFermeDisponiblePourEnvoi };
import { computeVenteSnapshot } from "@/lib/sales-calc";
import { eggsToTrays, traysToEggs } from "@/lib/units";
import { kpiResteAVerser } from "@/lib/kpi-sources";
import { KPI_LABEL } from "@/lib/terminology";
import { evaluateNotificationRules } from "@/lib/notifications/notification-rules";
import { getNotificationRepository } from "@/lib/notifications/notification-storage";
import { mergeNotificationSync } from "@/lib/notifications/notification-sync";
import { isFarmDataRemote } from "@/lib/farm-id";
import {
  FarmStoreSubscriptionProvider,
  useFarmSelector,
} from "@/contexts/farm-store-subscription";
import { farmStoreReducer } from "@/contexts/reducers";
import { buildAutoTransfert } from "@/contexts/reducers/shared";
import {
  type AppNotification,
  DEFAULT_FARM_ID,
} from "@/types/notifications";
import type { FarmStatePayload } from "@/lib/supabase/farm-mappers";
import {
  CATEGORIES_DEPENSES,
  METHODES_TRESORERIE,
  type ActionLog,
  type ActionType,
  type CategorieDepense,
  Depense,
  Tresorerie,
  FarmConfig,
  FarmPreferences,
  FarmProfil,
  FarmSeuils,
  type EntreeStatut,
  MethodeTresorerie,
  Module,
  Production,
  TransfertStatut,
  TransfertStock,
  Vente,
} from "@/types/domain";

/* ===========================================================
   État, actions, reducer
   =========================================================== */

export type FarmStoreError = {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
};

export type State = {
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
  /**
   * Transferts de stock Ferme → Magasin.
   * Posé en Phase B — consommé en lecture par Phase C/D.
   * En V1 (mono-site), tous créés en auto-confirm.
   */
  transferts: TransfertStock[];
  actions: ActionLog[];
  /** Configuration de la ferme (profil, préférences, seuils, listes). */
  config: FarmConfig;
  /** Dernière erreur métier (ex. doublon production / jour). */
  errors: FarmStoreError | null;
  /** Centre de notifications (cloche) — persistance via NotificationRepository. */
  notifications: AppNotification[];
};

/**
 * Drapeau global (V1) : tout nouveau transfert s'auto-confirme à la création.
 * Passera à `false` en V1.5 / V2 quand un toggle Paramètres existera.
 */
const TRANSFERT_AUTO_CONFIRM = true;

const EMPTY_VENTES: Vente[] = [];
const EMPTY_DEPENSES: Depense[] = [];
const EMPTY_TRESORERIE: Tresorerie[] = [];
const EMPTY_PRODUCTIONS: Production[] = [];
const EMPTY_TRANSFERTS: TransfertStock[] = [];

function buildHookState(fields: {
  productions?: Production[];
  ventes?: Vente[];
  depenses?: Depense[];
  tresorerie?: Tresorerie[];
  transferts?: TransfertStock[];
  actions: ActionLog[];
  config: FarmConfig;
  errors: FarmStoreError | null;
  notifications: AppNotification[];
}): State {
  return {
    productions: fields.productions ?? EMPTY_PRODUCTIONS,
    ventes: fields.ventes ?? EMPTY_VENTES,
    depenses: fields.depenses ?? EMPTY_DEPENSES,
    tresorerie: fields.tresorerie ?? EMPTY_TRESORERIE,
    transferts: fields.transferts ?? EMPTY_TRANSFERTS,
    actions: fields.actions,
    config: fields.config,
    errors: fields.errors,
    notifications: fields.notifications,
  };
}

function useSharedStoreSlices() {
  const actions = useFarmSelector((s) => s.actions);
  const config = useFarmSelector((s) => s.config);
  const errors = useFarmSelector((s) => s.errors);
  const notifications = useFarmSelector((s) => s.notifications);
  return { actions, config, errors, notifications };
}

export type FarmStoreAction =
  // Production
  | {
      type: "production/add";
      payload: {
        draft: Omit<Production, "id" | "semaineId" | "statut" | "createdAt" | "updatedAt">;
      };
    }
  | {
      type: "production/update";
      payload: {
        id: string;
        patch: Partial<
          Pick<Production, "jourISO" | "production" | "casses" | "envoyesVente" | "notes">
        >;
      };
    }
  | { type: "production/cancel"; payload: { id: string } }
  | { type: "production/restore"; payload: { id: string } }
  | {
      type: "production/restoreVersion";
      payload: { activeId: string; archiveId: string };
    }
  // Ventes
  | {
      type: "vente/add";
      payload: {
        draft: Omit<
          Vente,
          "id" | "semaineId" | "statut" | "createdAt" | "updatedAt" | "recuFerme" | "resteVente" | "montant"
        > & {
          // recuFerme et resteVente sont dérivés ; on ne les stocke pas tels quels.
          // montant est dérivé : alvéoles × prix casier.
        };
      };
    }
  | {
      type: "vente/addDay";
      payload: {
        drafts: VenteDraftInput[];
      };
    }
  | {
      type: "vente/update";
      payload: {
        id: string;
        patch: Partial<Pick<Vente, "jourISO" | "vendus" | "cassesVente" | "prix" | "client">>;
      };
    }
  | { type: "vente/cancel"; payload: { id: string } }
  | { type: "vente/restore"; payload: { id: string } }
  | {
      type: "vente/restoreVersion";
      payload: { activeId: string; archiveId: string };
    }
  // Dépenses
  | {
      type: "depense/add";
      payload: {
        draft: Omit<Depense, "id" | "semaineId" | "statut" | "createdAt" | "updatedAt">;
      };
    }
  | {
      type: "depense/addDay";
      payload: {
        jourISO: string;
        lignes: Array<{
          categorie: string;
          montant: number;
          description?: string;
        }>;
      };
    }
  | {
      type: "depense/update";
      payload: {
        id: string;
        patch: Partial<Pick<Depense, "jourISO" | "categorie" | "montant" | "description">>;
      };
    }
  | { type: "depense/cancel"; payload: { id: string } }
  | { type: "depense/restore"; payload: { id: string } }
  | {
      type: "depense/restoreVersion";
      payload: { activeId: string; archiveId: string };
    }
  // Trésorerie
  | {
      type: "tresorerie/add";
      payload: {
        draft: Omit<Tresorerie, "id" | "semaineId" | "statut" | "createdAt" | "updatedAt" | "reste">;
      };
    }
  | {
      type: "tresorerie/addDay";
      payload: {
        jourISO: string;
        lignes: Array<{
          methode: string;
          montantRecu: number;
          note?: string;
        }>;
      };
    }
  | {
      type: "tresorerie/update";
      payload: {
        id: string;
        patch: Partial<Pick<Tresorerie, "jourISO" | "montantRecu" | "depose" | "methode" | "note">>;
      };
    }
  | { type: "tresorerie/cancel"; payload: { id: string } }
  | { type: "tresorerie/restore"; payload: { id: string } }
  | {
      type: "tresorerie/restoreVersion";
      payload: { activeId: string; archiveId: string };
    }
  // Transferts (Ferme → Magasin)
  | {
      type: "transfert/confirm";
      payload: { id: string; quantiteRecue?: number; noteEcart?: string };
    }
  | {
      type: "transfert/contest";
      payload: { id: string; noteEcart: string };
    }
  | {
      type: "transfert/addManuel";
      payload: { jourISO: string; quantiteAlveoles: number; notes?: string };
    }
  // Configuration (Paramètres)
  | { type: "config/profil/update"; payload: { patch: Partial<FarmProfil> } }
  | { type: "config/preferences/update"; payload: { patch: Partial<FarmPreferences> } }
  | { type: "config/seuils/update"; payload: { patch: Partial<FarmSeuils> } }
  | {
      type: "config/categorie/update";
      payload: { id: string; patch: { label?: string; actif?: boolean } };
    }
  | { type: "config/categorie/add"; payload: { label: string } }
  | { type: "config/categorie/toggle"; payload: { id: string } }
  | {
      type: "config/methode/update";
      payload: { id: string; patch: { label?: string } };
    }
  | { type: "config/methode/add"; payload: { label: string } }
  | { type: "config/methode/toggle"; payload: { id: string } }
  | { type: "farm/bootstrap"; payload: FarmStatePayload }
  | { type: "notifications/hydrate"; payload: { items: AppNotification[] } }
  | { type: "notifications/set"; payload: { items: AppNotification[] } }
  | { type: "notifications/markRead"; payload: { id: string; readAt: string } }
  | { type: "notifications/dismiss"; payload: { id: string; dismissedAt: string } }
  | {
      type: "store/setError";
      payload: { code: string; message: string; meta?: Record<string, unknown> };
    }
  | { type: "store/clearError" };

/* ===========================================================
   Seed — mois civil en cours (lun–sam, alvéoles entières)
   =========================================================== */

function seedInitialState(): State {
  const today = startOfDay(new Date());
  const cap = DEFAULT_FARM_CONFIG.preferences.capacitePlateau;
  const productions: Production[] = [];
  const ventes: Vente[] = [];
  const depenses: Depense[] = [];
  const tresorerie: Tresorerie[] = [];
  const transferts: TransfertStock[] = [];

  const clients = ["Marché Madina", "Boutique Coléah", "Hôtel Kaloum", "Marché Niger"];
  const methodes: MethodeTresorerie[] = ["cash", "orange-money", "mtn-money", "virement"];

  const depenseCycles: Array<{
    everyDay?: boolean;
    everyN?: number;
    offset?: number;
    categorie: string;
    montant: number;
    description: string;
  }> = [
    {
      everyDay: true,
      categorie: "main-d-oeuvre",
      montant: 75_000,
      description: "Salaires journaliers ouvriers",
    },
    {
      everyN: 2,
      offset: 0,
      categorie: "alimentation",
      montant: 420_000,
      description: "Approvisionnement maïs + tourteau",
    },
    {
      everyN: 3,
      offset: 1,
      categorie: "transport",
      montant: 60_000,
      description: "Livraison vers marché Madina",
    },
    {
      everyN: 4,
      offset: 2,
      categorie: "emballage",
      montant: 95_000,
      description: "Achat plateaux carton",
    },
    {
      everyN: 6,
      offset: 5,
      categorie: "divers",
      montant: 45_000,
      description: "Petits achats — entretien",
    },
  ];

  const workingDays = eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).filter((d) => d.getDay() !== 0);

  workingDays.forEach((day, i) => {
    const ramasseesAlv = 15 + (i % 4);
    const casses = 2 + (i % 3);
    const misesAlv = Math.max(10, ramasseesAlv - 2 - (i % 3));
    const productionQty = ramasseesAlv * cap;
    const envoyes = misesAlv * cap;

    const created = addDays(day, 0).toISOString();
    const prodEntry: Production = {
      id: createId("prod"),
      jourISO: day.toISOString(),
      production: productionQty,
      casses,
      envoyesVente: envoyes,
      notes: i === 12 ? "Forte chaleur — ramassage matinal." : undefined,
      statut: "actif",
      createdAt: created,
      updatedAt: created,
    };
    productions.push(prodEntry);
    if (prodEntry.envoyesVente > 0) {
      transferts.push(buildAutoTransfert(prodEntry, created));
    }

    const vendusAlv = Math.max(1, misesAlv - 1 - (i % 2));
    const vendus = vendusAlv * cap;
    const cassesVente = i % 4 === 0 ? 2 : 0;
    const prix = [35_000, 36_000, 37_000, 38_000, 40_000][i % 5];
    const venteDraft = {
      jourISO: day.toISOString(),
      vendus,
      cassesVente,
      prix,
    };
    const venteSnap = computeVenteSnapshot(
      venteDraft,
      productions,
      ventes,
      cap
    );

    ventes.push({
      id: createId("vente"),
      ...venteDraft,
      recuFerme: venteSnap.recuFerme,
      resteVente: venteSnap.resteVente,
      montant: venteSnap.montant,
      client: clients[i % clients.length],
      statut: "actif",
      createdAt: created,
      updatedAt: created,
    });

    for (const cycle of depenseCycles) {
      const include = cycle.everyDay
        ? true
        : i % (cycle.everyN ?? 1) === (cycle.offset ?? 0);
      if (!include) continue;
      const jitter = 1 + (((i * 7) % 11) - 5) / 100;
      depenses.push({
        id: createId("dep"),
        jourISO: day.toISOString(),
        categorie: cycle.categorie,
        montant: Math.round((cycle.montant * jitter) / 500) * 500,
        description: cycle.description,
        statut: "actif",
        createdAt: created,
        updatedAt: created,
      });
    }

    const montantRecuJour = venteSnap.montant;
    const arrondi = Math.round(montantRecuJour / 1000) * 1000;
    const methode = methodes[i % methodes.length];
    const totalDeposit = i % 5 >= 2;
    const depose = totalDeposit
      ? arrondi
      : Math.round((arrondi * (0.55 + (i % 4) * 0.08)) / 1000) * 1000;

    tresorerie.push({
      id: createId("tresorerie"),
      jourISO: day.toISOString(),
      montantRecu: arrondi,
      depose,
      reste: arrondi - depose,
      methode,
      note: !totalDeposit ? "Solde restant à verser la semaine prochaine." : undefined,
      statut: "actif",
      createdAt: created,
      updatedAt: created,
    });
  });

  const config: FarmConfig = {
    ...DEFAULT_FARM_CONFIG,
    listes: {
      ...DEFAULT_FARM_CONFIG.listes,
      categoriesDepense:
        DEFAULT_FARM_CONFIG.listes.categoriesDepense.length > 0
          ? DEFAULT_FARM_CONFIG.listes.categoriesDepense
          : buildDefaultCategoriesDepense(),
      methodesPaiement:
        DEFAULT_FARM_CONFIG.listes.methodesPaiement.length > 0
          ? DEFAULT_FARM_CONFIG.listes.methodesPaiement
          : buildDefaultMethodesPaiement(),
    },
  };

  const configMigre: FarmConfig = {
    ...config,
    listes: {
      ...config.listes,
      methodesPaiement: migrateConfigMethodesPaiement(config.listes.methodesPaiement),
    },
  };

  const depensesMigrees = migrateDepensesCategories(
    depenses,
    configMigre.listes.categoriesDepense
  );
  const tresorerieMigree = migrateMethodesTresorerie(
    tresorerie,
    configMigre.listes.methodesPaiement
  );

  return {
    productions,
    ventes,
    depenses: depensesMigrees,
    tresorerie: tresorerieMigree,
    transferts,
    actions: [
      {
        id: createId("act"),
        dateISO: new Date().toISOString(),
        type: "creation",
        module: "production",
        cibleId: "seed",
        description:
          "Mois en cours chargé (alvéoles entières, lun–sam).",
      },
    ],
    config: configMigre,
    errors: null,
    notifications: [],
  };
}

/* ===========================================================
   Contexte React
   =========================================================== */

type Dispatch = React.Dispatch<FarmStoreAction>;

const FarmStateContext = React.createContext<State | null>(null);
const FarmDispatchContext = React.createContext<Dispatch | null>(null);

function FarmNotificationEffects() {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
  const stateRefForNotifications = React.useRef(state);
  stateRefForNotifications.current = state;
  const [hydrated, setHydrated] = React.useState(false);
  const repo = React.useMemo(() => getNotificationRepository(), []);

  React.useEffect(() => {
    let cancelled = false;
    void repo.load(DEFAULT_FARM_ID).then((items) => {
      if (cancelled) return;
      dispatch({ type: "notifications/hydrate", payload: { items } });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [repo, dispatch]);

  React.useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const current = stateRefForNotifications.current;
      const drafts = evaluateNotificationRules({
        productions: current.productions,
        ventes: current.ventes,
        depenses: current.depenses,
        tresorerie: current.tresorerie,
        transferts: current.transferts,
        config: current.config,
      });
      const merged = mergeNotificationSync(
        current.notifications,
        drafts,
        new Date().toISOString(),
        DEFAULT_FARM_ID
      );
      dispatch({ type: "notifications/set", payload: { items: merged } });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    hydrated,
    state.productions,
    state.ventes,
    state.depenses,
    state.tresorerie,
    state.transferts,
    state.config,
    dispatch,
  ]);

  React.useEffect(() => {
    if (!hydrated) return;
    const active = state.notifications.filter((n) => !n.resolvedAt);
    const t = window.setTimeout(() => {
      void repo.upsertMany(DEFAULT_FARM_ID, active);
    }, 300);
    return () => window.clearTimeout(t);
  }, [hydrated, state.notifications, repo]);

  return null;
}

function createEmptyState(): State {
  return {
    productions: [],
    ventes: [],
    depenses: [],
    tresorerie: [],
    transferts: [],
    actions: [],
    config: DEFAULT_FARM_CONFIG,
    errors: null,
    notifications: [],
  };
}

export function FarmStoreProvider({ children }: { children: React.ReactNode }) {
  const remote = isFarmDataRemote();
  const [state, dispatch] = React.useReducer(farmStoreReducer, undefined, createEmptyState);
  const [remoteReady, setRemoteReady] = React.useState(!remote);
  const skipSave = React.useRef(true);

  React.useEffect(() => {
    if (!remote) return;
    let cancelled = false;
    void fetch("/api/farm/state", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<FarmStatePayload>;
      })
      .then((payload) => {
        if (cancelled) return;
        dispatch({ type: "farm/bootstrap", payload });
        skipSave.current = false;
        setRemoteReady(true);
      })
      .catch((err) => {
        console.error("[FarmStoreProvider] chargement Supabase", err);
        skipSave.current = false;
        setRemoteReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [remote]);

  React.useEffect(() => {
    if (!remote || !remoteReady || skipSave.current) return;
    const t = window.setTimeout(() => {
      const payload: FarmStatePayload = {
        productions: state.productions,
        ventes: state.ventes,
        depenses: state.depenses,
        tresorerie: state.tresorerie,
        transferts: state.transferts,
        actions: state.actions,
        config: state.config,
      };
      void fetch("/api/farm/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.error("[FarmStoreProvider] sauvegarde", err));
    }, 900);
    return () => window.clearTimeout(t);
  }, [
    remote,
    remoteReady,
    state.productions,
    state.ventes,
    state.depenses,
    state.tresorerie,
    state.transferts,
    state.actions,
    state.config,
  ]);

  if (remote && !remoteReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement des données LanaFarm…
      </div>
    );
  }

  return (
    <FarmStateContext.Provider value={state}>
      <FarmDispatchContext.Provider value={dispatch}>
        <FarmStoreSubscriptionProvider state={state}>
          <FarmNotificationEffects />
          {children}
        </FarmStoreSubscriptionProvider>
      </FarmDispatchContext.Provider>
    </FarmStateContext.Provider>
  );
}

function useFarmState(): State {
  const ctx = React.useContext(FarmStateContext);
  if (!ctx) {
    throw new Error("FarmStoreProvider manquant dans l'arbre React.");
  }
  return ctx;
}

function useFarmDispatch(): Dispatch {
  const ctx = React.useContext(FarmDispatchContext);
  if (!ctx) {
    throw new Error("FarmStoreProvider manquant dans l'arbre React.");
  }
  return ctx;
}

/* ===========================================================
   Hooks publics — un par "univers" métier
   Même surface qu'avant, simplement adossée au store unifié.
   =========================================================== */

export type ProductionDraftInput = Omit<
  Production,
  "id" | "semaineId" | "statut" | "createdAt" | "updatedAt"
>;
export type ProductionPatch = Partial<
  Pick<Production, "jourISO" | "production" | "casses" | "envoyesVente" | "notes">
>;

export type VenteDraftInput = Omit<
  Vente,
  "id" | "semaineId" | "statut" | "createdAt" | "updatedAt" | "recuFerme" | "resteVente" | "montant"
>;
export type VentePatch = Partial<
  Pick<Vente, "jourISO" | "vendus" | "cassesVente" | "prix" | "client">
>;

export type DepenseDraftInput = Omit<
  Depense,
  "id" | "semaineId" | "statut" | "createdAt" | "updatedAt"
>;
export type DepensePatch = Partial<
  Pick<Depense, "jourISO" | "categorie" | "montant" | "description">
>;

export type TresorerieDraftInput = Omit<
  Tresorerie,
  "id" | "semaineId" | "statut" | "createdAt" | "updatedAt" | "reste"
>;
export type TresoreriePatch = Partial<
  Pick<Tresorerie, "jourISO" | "montantRecu" | "depose" | "methode" | "note">
>;

type CommonSelectors = {
  getActionsForModule: (module: Module, type?: ActionType) => ActionLog[];
};

type ProductionStore = CommonSelectors & {
  state: State;
  addProduction: (draft: ProductionDraftInput) => void;
  updateProduction: (id: string, patch: ProductionPatch) => void;
  cancelProduction: (id: string) => void;
  restoreProduction: (id: string) => void;
  restoreProductionVersion: (activeId: string, archiveId: string) => void;
  getActiveProductions: () => Production[];
  clearError: () => void;
};

type SalesStore = CommonSelectors & {
  state: State;
  addSale: (draft: VenteDraftInput) => void;
  addSalesDay: (drafts: VenteDraftInput[]) => void;
  updateSale: (id: string, patch: VentePatch) => void;
  cancelSale: (id: string) => void;
  restoreSale: (id: string) => void;
  restoreSaleVersion: (activeId: string, archiveId: string) => void;
  getActiveSales: () => Vente[];
  clearError: () => void;
};

export type DepenseDayLineInput = {
  categorie: string;
  montant: number;
  description?: string;
};

export type TresorerieDayLineInput = {
  methode: string;
  montantRecu: number;
  note?: string;
};

type ExpensesStore = CommonSelectors & {
  state: State;
  addExpense: (draft: DepenseDraftInput) => void;
  addExpensesDay: (
    jourISO: string,
    lignes: DepenseDayLineInput[]
  ) => void;
  updateExpense: (id: string, patch: DepensePatch) => void;
  cancelExpense: (id: string) => void;
  restoreExpense: (id: string) => void;
  restoreExpenseVersion: (activeId: string, archiveId: string) => void;
  getActiveExpenses: () => Depense[];
  clearError: () => void;
};

type TresorerieStore = CommonSelectors & {
  state: State;
  addTresorerie: (draft: TresorerieDraftInput) => void;
  addTresorerieDay: (
    jourISO: string,
    lignes: TresorerieDayLineInput[]
  ) => void;
  updateTresorerie: (id: string, patch: TresoreriePatch) => void;
  cancelTresorerie: (id: string) => void;
  restoreTresorerie: (id: string) => void;
  restoreTresorerieVersion: (activeId: string, archiveId: string) => void;
  getActiveTresorerie: () => Tresorerie[];
  clearError: () => void;
};

type TransfersStore = CommonSelectors & {
  state: State;
  /** Tous les transferts (toutes statuts confondus). */
  getAllTransfers: () => TransfertStock[];
  /** Transferts au statut "recu" — source de vérité Phase C. */
  getReceivedTransfers: () => TransfertStock[];
  /** Transferts en attente de confirmation (futur panneau réception). */
  getPendingTransfers: () => TransfertStock[];
  /** Transferts liés à une production donnée (traçabilité). */
  getTransfersByProduction: (productionId: string) => TransfertStock[];
  /** Confirmation manuelle (sera utilisée quand auto-confirm = false). */
  confirmTransfer: (id: string, opts?: { quantiteRecue?: number; noteEcart?: string }) => void;
  contestTransfer: (id: string, noteEcart: string) => void;
  addManualTransfer: (payload: {
    jourISO: string;
    quantiteAlveoles: number;
    notes?: string;
  }) => void;
};

function buildCommonSelectors(state: State, dispatch: Dispatch): CommonSelectors {
  return {
    getActionsForModule: (module, type) =>
      state.actions.filter((a) => a.module === module && (type ? a.type === type : true)),
  };
}

export function useProductionStore(): ProductionStore {
  const dispatch = useFarmDispatch();
  const productions = useFarmSelector((s) => s.productions);
  const transferts = useFarmSelector((s) => s.transferts);
  const { actions, config, errors, notifications } = useSharedStoreSlices();

  const state = React.useMemo(
    () =>
      buildHookState({
        productions,
        transferts,
        actions,
        config,
        errors,
        notifications,
      }),
    [productions, transferts, actions, config, errors, notifications]
  );

  return React.useMemo<ProductionStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      addProduction: (draft) => dispatch({ type: "production/add", payload: { draft } }),
      updateProduction: (id, patch) =>
        dispatch({ type: "production/update", payload: { id, patch } }),
      cancelProduction: (id) => dispatch({ type: "production/cancel", payload: { id } }),
      restoreProduction: (id) => dispatch({ type: "production/restore", payload: { id } }),
      restoreProductionVersion: (activeId, archiveId) =>
        dispatch({ type: "production/restoreVersion", payload: { activeId, archiveId } }),
      getActiveProductions: () => productions.filter((p) => p.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch, productions]
  );
}

export function useSalesStore(): SalesStore {
  const dispatch = useFarmDispatch();
  const ventes = useFarmSelector((s) => s.ventes);
  const { actions, config, errors, notifications } = useSharedStoreSlices();

  const state = React.useMemo(
    () =>
      buildHookState({
        ventes,
        actions,
        config,
        errors,
        notifications,
      }),
    [ventes, actions, config, errors, notifications]
  );

  return React.useMemo<SalesStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      addSale: (draft) => dispatch({ type: "vente/add", payload: { draft } }),
      addSalesDay: (drafts) => dispatch({ type: "vente/addDay", payload: { drafts } }),
      updateSale: (id, patch) =>
        dispatch({ type: "vente/update", payload: { id, patch } }),
      cancelSale: (id) => dispatch({ type: "vente/cancel", payload: { id } }),
      restoreSale: (id) => dispatch({ type: "vente/restore", payload: { id } }),
      restoreSaleVersion: (activeId, archiveId) =>
        dispatch({ type: "vente/restoreVersion", payload: { activeId, archiveId } }),
      getActiveSales: () => ventes.filter((v) => v.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch, ventes]
  );
}

export function useExpensesStore(): ExpensesStore {
  const dispatch = useFarmDispatch();
  const depenses = useFarmSelector((s) => s.depenses);
  const { actions, config, errors, notifications } = useSharedStoreSlices();

  const state = React.useMemo(
    () =>
      buildHookState({
        depenses,
        actions,
        config,
        errors,
        notifications,
      }),
    [depenses, actions, config, errors, notifications]
  );

  return React.useMemo<ExpensesStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      addExpense: (draft) => dispatch({ type: "depense/add", payload: { draft } }),
      addExpensesDay: (jourISO, lignes) =>
        dispatch({ type: "depense/addDay", payload: { jourISO, lignes } }),
      updateExpense: (id, patch) =>
        dispatch({ type: "depense/update", payload: { id, patch } }),
      cancelExpense: (id) => dispatch({ type: "depense/cancel", payload: { id } }),
      restoreExpense: (id) => dispatch({ type: "depense/restore", payload: { id } }),
      restoreExpenseVersion: (activeId, archiveId) =>
        dispatch({ type: "depense/restoreVersion", payload: { activeId, archiveId } }),
      getActiveExpenses: () => depenses.filter((d) => d.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch, depenses]
  );
}

export function useTresorerieStore(): TresorerieStore {
  const dispatch = useFarmDispatch();
  const tresorerie = useFarmSelector((s) => s.tresorerie);
  const { actions, config, errors, notifications } = useSharedStoreSlices();

  const state = React.useMemo(
    () =>
      buildHookState({
        tresorerie,
        actions,
        config,
        errors,
        notifications,
      }),
    [tresorerie, actions, config, errors, notifications]
  );

  return React.useMemo<TresorerieStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      addTresorerie: (draft) => dispatch({ type: "tresorerie/add", payload: { draft } }),
      addTresorerieDay: (jourISO, lignes) =>
        dispatch({ type: "tresorerie/addDay", payload: { jourISO, lignes } }),
      updateTresorerie: (id, patch) =>
        dispatch({ type: "tresorerie/update", payload: { id, patch } }),
      cancelTresorerie: (id) => dispatch({ type: "tresorerie/cancel", payload: { id } }),
      restoreTresorerie: (id) => dispatch({ type: "tresorerie/restore", payload: { id } }),
      restoreTresorerieVersion: (activeId, archiveId) =>
        dispatch({ type: "tresorerie/restoreVersion", payload: { activeId, archiveId } }),
      getActiveTresorerie: () => tresorerie.filter((d) => d.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch, tresorerie]
  );
}

export function useTransfersStore(): TransfersStore {
  const dispatch = useFarmDispatch();
  const transferts = useFarmSelector((s) => s.transferts);
  const { actions, config, errors, notifications } = useSharedStoreSlices();

  const state = React.useMemo(
    () =>
      buildHookState({
        transferts,
        actions,
        config,
        errors,
        notifications,
      }),
    [transferts, actions, config, errors, notifications]
  );

  return React.useMemo<TransfersStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      getAllTransfers: () => transferts,
      getReceivedTransfers: () => transferts.filter((t) => t.statut === "recu"),
      getPendingTransfers: () => transferts.filter((t) => t.statut === "en_attente"),
      getTransfersByProduction: (productionId) =>
        transferts.filter(
          (t) => t.productionId != null && t.productionId === productionId
        ),
      confirmTransfer: (id, opts) =>
        dispatch({
          type: "transfert/confirm",
          payload: { id, quantiteRecue: opts?.quantiteRecue, noteEcart: opts?.noteEcart },
        }),
      contestTransfer: (id, noteEcart) =>
        dispatch({ type: "transfert/contest", payload: { id, noteEcart } }),
      addManualTransfer: (payload) =>
        dispatch({ type: "transfert/addManuel", payload }),
    }),
    [state, dispatch, transferts]
  );
}

/* ===========================================================
   Configuration (Paramètres) — slice config du store
   =========================================================== */

type ConfigStore = {
  config: FarmConfig;
  /** Mises à jour de sections complètes. */
  updateProfil: (patch: Partial<FarmProfil>) => void;
  updatePreferences: (patch: Partial<FarmPreferences>) => void;
  updateSeuils: (patch: Partial<FarmSeuils>) => void;
  /** Listes typées (renommage + soft-disable — catégories par défaut). */
  updateCategorie: (id: string, patch: { label?: string; actif?: boolean }) => void;
  addCategorie: (label: string) => void;
  toggleCategorie: (id: string) => void;
  storeError: FarmStoreError | null;
  clearStoreError: () => void;
  updateMethode: (id: string, patch: { label?: string }) => void;
  addMethode: (label: string) => void;
  toggleMethode: (id: string) => void;
};

export function useConfigStore(): ConfigStore {
  const dispatch = useFarmDispatch();
  const config = useFarmSelector((s) => s.config);
  const errors = useFarmSelector((s) => s.errors);
  return React.useMemo<ConfigStore>(
    () => ({
      config,
      updateProfil: (patch) =>
        dispatch({ type: "config/profil/update", payload: { patch } }),
      updatePreferences: (patch) =>
        dispatch({ type: "config/preferences/update", payload: { patch } }),
      updateSeuils: (patch) =>
        dispatch({ type: "config/seuils/update", payload: { patch } }),
      updateCategorie: (id, patch) =>
        dispatch({ type: "config/categorie/update", payload: { id, patch } }),
      addCategorie: (label) =>
        dispatch({ type: "config/categorie/add", payload: { label } }),
      toggleCategorie: (id) =>
        dispatch({ type: "config/categorie/toggle", payload: { id } }),
      storeError: errors,
      clearStoreError: () => dispatch({ type: "store/clearError" }),
      updateMethode: (id, patch) =>
        dispatch({ type: "config/methode/update", payload: { id, patch } }),
      addMethode: (label) =>
        dispatch({ type: "config/methode/add", payload: { label } }),
      toggleMethode: (id) =>
        dispatch({ type: "config/methode/toggle", payload: { id } }),
    }),
    [config, errors, dispatch]
  );
}

/**
 * Lecture seule du config — équivalent au pattern `useFarmState_unsafe`,
 * destiné aux consommateurs qui n'ont pas besoin du dispatch (Dashboard, Rapports).
 */
export function useFarmConfig(): FarmConfig {
  return useFarmSelector((s) => s.config);
}

/** Accès brut pour la lecture cross-modules (Dashboard, Rapports). */
export function useFarmState_unsafe(): State {
  return useFarmSelector((s) => s);
}

type NotificationsStore = {
  notifications: AppNotification[];
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
};

export function useNotificationsStore(): NotificationsStore {
  const dispatch = useFarmDispatch();
  const notifications = useFarmSelector((s) => s.notifications);
  return React.useMemo(
    () => ({
      notifications,
      markRead: (id) =>
        dispatch({
          type: "notifications/markRead",
          payload: { id, readAt: new Date().toISOString() },
        }),
      dismiss: (id) =>
        dispatch({
          type: "notifications/dismiss",
          payload: { id, dismissedAt: new Date().toISOString() },
        }),
    }),
    [notifications, dispatch]
  );
}
