import { createId } from "@/lib/ids";
import { kpiResteAVerser } from "@/lib/kpi-sources";
import type { State } from "@/contexts/farm-store";
import type {
  ActionLog,
  Depense,
  EntreeStatut,
  Production,
  TransfertStatut,
  TransfertStock,
  Tresorerie,
  Vente,
} from "@/types/domain";

export const TRANSFERT_AUTO_CONFIRM = true;
export function resteAVerserGlobal(state: State): number {
  const cap = state.config.preferences.capacitePlateau;
  return kpiResteAVerser(
    state.ventes,
    state.depenses,
    state.tresorerie,
    cap,
    state.config
  );
}

export function resteAVerserSansEntree(state: State, excludeId: string): number {
  const cap = state.config.preferences.capacitePlateau;
  const tresorerie = state.tresorerie.filter(
    (t) => t.statut === "actif" && t.id !== excludeId
  );
  return kpiResteAVerser(
    state.ventes,
    state.depenses,
    tresorerie,
    cap,
    state.config
  );
}

export function setStoreError(
  state: State,
  payload: { code: string; message: string; meta?: Record<string, unknown> }
): State {
  return { ...state, errors: payload };
}

export function pushLog(state: State, payload: Omit<ActionLog, "id" | "dateISO">): State {
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
export function buildAutoTransfert(
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
export function reconcileTransfertsForProduction(
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

export const ARCHIVE_MOTIF_MODIFIE = "modifié";

type ArchivableModule = "production" | "vente" | "depense" | "tresorerie";
type ArchivableEntry = Production | Vente | Depense | Tresorerie;

type ArchiveEntryResult<T extends ArchivableEntry> = {
  shouldArchive: boolean;
  archived: T | null;
  merged: T;
};

const ARCHIVE_VALUE_KEYS: Record<ArchivableModule, readonly string[]> = {
  production: ["production", "casses", "envoyesVente", "notes"],
  vente: ["vendus", "cassesVente", "prix", "client"],
  depense: ["categorie", "montant", "description"],
  tresorerie: ["montantRecu", "depose", "methode", "note"],
};

export function hasArchiveableValueChanges<T extends ArchivableEntry>(
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
export function archiveEntry<T extends ArchivableEntry>(
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

export function sharesEntryLineage(
  active: { id: string; lineageId?: string },
  archive: { id: string; lineageId?: string; statut: EntreeStatut }
): boolean {
  if (archive.statut !== "archive") return false;
  const lineage = active.lineageId ?? active.id;
  return (archive.lineageId ?? archive.id) === lineage;
}