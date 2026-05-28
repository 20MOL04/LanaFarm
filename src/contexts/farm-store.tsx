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
import { evaluateNotificationRules } from "@/lib/notifications/notification-rules";
import { getNotificationRepository } from "@/lib/notifications/notification-storage";
import { mergeNotificationSync } from "@/lib/notifications/notification-sync";
import { isFarmDataRemote } from "@/lib/farm-id";
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

type State = {
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

type Action =
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
          Pick<Production, "jourISO" | "production" | "casses" | "perdus" | "envoyesVente" | "notes">
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

function setStoreError(
  state: State,
  payload: { code: string; message: string; meta?: Record<string, unknown> }
): State {
  return { ...state, errors: payload };
}

function pushLog(state: State, payload: Omit<ActionLog, "id" | "dateISO">): State {
  const log: ActionLog = {
    id: createId("act"),
    dateISO: new Date().toISOString(),
    ...payload,
  };
  return { ...state, actions: [log, ...state.actions] };
}

/* ===========================================================
   Helpers transferts (utilisés en cascade par les hooks Production)
   =========================================================== */

/**
 * Construit un transfert pour une production donnée — auto-confirmé si la
 * V1 mono-site est active. Pas de side-effect : retourne l'objet pur.
 */
function buildAutoTransfert(
  production: Production,
  now: string
): TransfertStock {
  const auto = TRANSFERT_AUTO_CONFIRM;
  return {
    id: createId("xfer"),
    productionId: production.id,
    jourEnvoiISO: production.jourISO,
    jourReceptionISO: auto ? production.jourISO : undefined,
    quantiteEnvoyee: production.envoyesVente,
    quantiteRecue: auto ? production.envoyesVente : undefined,
    ecart: auto ? 0 : undefined,
    statut: auto ? "recu" : "en_attente",
    autoConfirm: auto,
    semaineId: production.semaineId,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Réconcilie les transferts liés à une production qui vient d'être modifiée
 * ou changée d'état. Stratégie :
 *  - envoyesVente passé à > 0 et aucun transfert existant → on en crée un.
 *  - envoyesVente changé sur un transfert existant non-figé (statut "en_attente"
 *    ou autoConfirm true) → on aligne quantiteEnvoyee (+ quantiteRecue si auto).
 *  - envoyesVente passé à 0 / production annulée → on marque les transferts
 *    liés en "conteste" (jamais supprimés — traçabilité).
 *  - production restaurée → transferts liés "conteste" → repassent à "recu"
 *    (si autoConfirm) ou "en_attente".
 */
function reconcileTransfertsForProduction(
  state: State,
  production: Production,
  now: string,
  context: "update" | "cancel" | "restore"
): State {
  const linked = state.transferts.filter((t) => t.productionId === production.id);

  // 1. Annulation → tous les transferts liés deviennent "conteste"
  if (context === "cancel") {
    if (linked.length === 0) return state;
    const transferts = state.transferts.map((t) =>
      t.productionId === production.id && t.statut !== "conteste"
        ? {
            ...t,
            statut: "conteste" as TransfertStatut,
            noteEcart: t.noteEcart ?? "Production source annulée.",
            updatedAt: now,
          }
        : t
    );
    return { ...state, transferts };
  }

  // 2. Restauration → re-confirme les transferts contestés liés
  if (context === "restore") {
    if (linked.length === 0) {
      if (production.envoyesVente > 0) {
        return {
          ...state,
          transferts: [buildAutoTransfert(production, now), ...state.transferts],
        };
      }
      return state;
    }
    const transferts = state.transferts.map((t) => {
      if (t.productionId !== production.id) return t;
      if (t.statut !== "conteste") return t;
      const auto = t.autoConfirm;
      return {
        ...t,
        statut: (auto ? "recu" : "en_attente") as TransfertStatut,
        quantiteRecue: auto ? t.quantiteEnvoyee : undefined,
        jourReceptionISO: auto ? t.jourEnvoiISO : undefined,
        ecart: auto ? 0 : undefined,
        noteEcart: undefined,
        updatedAt: now,
      };
    });
    return { ...state, transferts };
  }

  // 3. Mise à jour (champ envoyesVente / jourISO)
  if (linked.length === 0) {
    if (production.envoyesVente > 0) {
      return {
        ...state,
        transferts: [buildAutoTransfert(production, now), ...state.transferts],
      };
    }
    return state;
  }

  // Cas mono-site : 1 production = 1 transfert. On synchronise le 1er actif.
  const principal = linked.find((t) => t.statut !== "conteste") ?? linked[0];

  if (production.envoyesVente === 0) {
    const transferts = state.transferts.map((t) =>
      t.id === principal.id
        ? {
            ...t,
            statut: "conteste" as TransfertStatut,
            noteEcart: "Production mise à jour : envoi ramené à 0.",
            updatedAt: now,
          }
        : t
    );
    return { ...state, transferts };
  }

  const auto = principal.autoConfirm;
  const transferts = state.transferts.map((t) =>
    t.id === principal.id
      ? {
          ...t,
          jourEnvoiISO: production.jourISO,
          jourReceptionISO: auto ? production.jourISO : t.jourReceptionISO,
          quantiteEnvoyee: production.envoyesVente,
          quantiteRecue: auto
            ? production.envoyesVente
            : t.quantiteRecue,
          ecart: auto ? 0 : t.ecart,
          statut: t.statut === "conteste"
            ? ((auto ? "recu" : "en_attente") as TransfertStatut)
            : t.statut,
          semaineId: production.semaineId,
          updatedAt: now,
        }
      : t
  );
  return { ...state, transferts };
}

/* ===========================================================
   Archivage versions (R6C) — source unique pour les 4 modules
   =========================================================== */

const ARCHIVE_MOTIF_MODIFIE = "modifié";

type ArchivableModule = "production" | "vente" | "depense" | "tresorerie";
type ArchivableEntry = Production | Vente | Depense | Tresorerie;

type ArchiveEntryResult<T extends ArchivableEntry> = {
  shouldArchive: boolean;
  archived: T | null;
  merged: T;
};

const ARCHIVE_VALUE_KEYS: Record<ArchivableModule, readonly string[]> = {
  production: ["production", "casses", "perdus", "envoyesVente", "notes"],
  vente: ["vendus", "cassesVente", "prix", "client"],
  depense: ["categorie", "montant", "description"],
  tresorerie: ["montantRecu", "depose", "methode", "note"],
};

function hasArchiveableValueChanges<T extends ArchivableEntry>(
  module: ArchivableModule,
  before: T,
  patch: Partial<T>
): boolean {
  for (const key of ARCHIVE_VALUE_KEYS[module]) {
    if (!(key in patch)) continue;
    const next = (patch as Record<string, unknown>)[key];
    const prev = (before as Record<string, unknown>)[key];
    if (next !== prev) return true;
  }
  return false;
}

/** Archive l'état courant avant modification de valeurs métier (pas jourISO seul). */
function archiveEntry<T extends ArchivableEntry>(
  module: ArchivableModule,
  entry: T,
  patch: Partial<T>,
  now: string,
  idPrefix: string
): ArchiveEntryResult<T> {
  const lineageId = entry.lineageId ?? entry.id;
  const merged = {
    ...entry,
    ...patch,
    lineageId,
    archiveMotif: undefined,
    updatedAt: now,
  } as T;

  if (!hasArchiveableValueChanges(module, entry, patch)) {
    return { shouldArchive: false, archived: null, merged };
  }

  const archived = {
    ...entry,
    id: createId(idPrefix),
    statut: "archive" as const,
    lineageId,
    archiveMotif: ARCHIVE_MOTIF_MODIFIE,
    updatedAt: now,
  } as T;

  return { shouldArchive: true, archived, merged };
}

function sharesEntryLineage(
  active: { id: string; lineageId?: string },
  archive: { id: string; lineageId?: string; statut: EntreeStatut }
): boolean {
  if (archive.statut !== "archive") return false;
  const lineage = active.lineageId ?? active.id;
  return (archive.lineageId ?? archive.id) === lineage;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    /* -------- Productions -------- */
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
          perdus: archive.perdus,
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

    /* -------- Ventes -------- */
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

    /* -------- Dépenses -------- */
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

    /* -------- Trésorerie -------- */
    case "tresorerie/add": {
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

      const total = normalized.reduce((sum, l) => sum + l.montantRecu, 0);
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
      let s1: State = {
        ...state,
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

    /* -------- Transferts (Ferme → Magasin) -------- */
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
          message: `Stock ferme insuffisant. Disponible : ${dispoAlv} alv. Demandé : ${Math.floor(quantiteAlveoles)} alv.`,
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

    /* -------- Configuration (Paramètres) -------- */
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

type Dispatch = React.Dispatch<Action>;

const FarmStateContext = React.createContext<State | null>(null);
const FarmDispatchContext = React.createContext<Dispatch | null>(null);

function FarmNotificationEffects() {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
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
    const drafts = evaluateNotificationRules({
      productions: state.productions,
      ventes: state.ventes,
      depenses: state.depenses,
      tresorerie: state.tresorerie,
      transferts: state.transferts,
      config: state.config,
    });
    const merged = mergeNotificationSync(
      state.notifications,
      drafts,
      new Date().toISOString(),
      DEFAULT_FARM_ID
    );
    dispatch({ type: "notifications/set", payload: { items: merged } });
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
  const [state, dispatch] = React.useReducer(reducer, undefined, createEmptyState);
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
        <FarmNotificationEffects />
        {children}
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
  Pick<Production, "jourISO" | "production" | "casses" | "perdus" | "envoyesVente" | "notes">
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
  const state = useFarmState();
  const dispatch = useFarmDispatch();
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
      getActiveProductions: () => state.productions.filter((p) => p.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch]
  );
}

export function useSalesStore(): SalesStore {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
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
      getActiveSales: () => state.ventes.filter((v) => v.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch]
  );
}

export function useExpensesStore(): ExpensesStore {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
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
      getActiveExpenses: () => state.depenses.filter((d) => d.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch]
  );
}

export function useTresorerieStore(): TresorerieStore {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
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
      getActiveTresorerie: () => state.tresorerie.filter((d) => d.statut === "actif"),
      clearError: () => dispatch({ type: "store/clearError" }),
    }),
    [state, dispatch]
  );
}

export function useTransfersStore(): TransfersStore {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
  return React.useMemo<TransfersStore>(
    () => ({
      state,
      ...buildCommonSelectors(state, dispatch),
      getAllTransfers: () => state.transferts,
      getReceivedTransfers: () => state.transferts.filter((t) => t.statut === "recu"),
      getPendingTransfers: () => state.transferts.filter((t) => t.statut === "en_attente"),
      getTransfersByProduction: (productionId) =>
        state.transferts.filter(
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
    [state, dispatch]
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
  const state = useFarmState();
  const dispatch = useFarmDispatch();
  return React.useMemo<ConfigStore>(
    () => ({
      config: state.config,
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
      storeError: state.errors,
      clearStoreError: () => dispatch({ type: "store/clearError" }),
      updateMethode: (id, patch) =>
        dispatch({ type: "config/methode/update", payload: { id, patch } }),
      addMethode: (label) =>
        dispatch({ type: "config/methode/add", payload: { label } }),
      toggleMethode: (id) =>
        dispatch({ type: "config/methode/toggle", payload: { id } }),
    }),
    [state.config, state.errors, dispatch]
  );
}

/**
 * Lecture seule du config — équivalent au pattern `useFarmState_unsafe`,
 * destiné aux consommateurs qui n'ont pas besoin du dispatch (Dashboard, Rapports).
 */
export function useFarmConfig(): FarmConfig {
  return useFarmState().config;
}

/** Accès brut pour la lecture cross-modules (Dashboard, Rapports). */
export function useFarmState_unsafe(): State {
  return useFarmState();
}

type NotificationsStore = {
  notifications: AppNotification[];
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
};

export function useNotificationsStore(): NotificationsStore {
  const state = useFarmState();
  const dispatch = useFarmDispatch();
  return React.useMemo(
    () => ({
      notifications: state.notifications,
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
    [state.notifications, dispatch]
  );
}
