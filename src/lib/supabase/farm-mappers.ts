import type {
  ActionLog,
  Depense,
  FarmConfig,
  Production,
  TransfertStock,
  Tresorerie,
  Vente,
} from "@/types/domain";

/* ——— Rows Postgres (snake_case) ——— */

export type ProductionRow = {
  id: string;
  farm_id: string;
  jour_iso: string;
  production: number;
  casses: number;
  perdus: number;
  envoyes_vente: number;
  notes: string | null;
  semaine_id: string | null;
  lineage_id: string | null;
  archive_motif: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type VenteRow = {
  id: string;
  farm_id: string;
  jour_iso: string;
  vendus: number;
  casses_vente: number;
  prix: number;
  client: string | null;
  semaine_id: string | null;
  lineage_id: string | null;
  archive_motif: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type DepenseRow = {
  id: string;
  farm_id: string;
  jour_iso: string;
  categorie: string;
  montant: number;
  description: string | null;
  semaine_id: string | null;
  lineage_id: string | null;
  archive_motif: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type TresorerieRow = {
  id: string;
  farm_id: string;
  jour_iso: string;
  montant_recu: number;
  depose: number;
  reste: number;
  methode: string;
  note: string | null;
  semaine_id: string | null;
  lineage_id: string | null;
  archive_motif: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type TransfertRow = {
  id: string;
  farm_id: string;
  production_id: string | null;
  jour_envoi_iso: string;
  jour_reception_iso: string | null;
  quantite_envoyee: number;
  quantite_recue: number | null;
  ecart: number | null;
  note_ecart: string | null;
  statut: string;
  auto_confirm: boolean;
  semaine_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionLogRow = {
  id: string;
  farm_id: string;
  date_iso: string;
  type: string;
  module: string;
  cible_id: string;
  description: string;
  champ: string | null;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  utilisateur: string | null;
  created_at: string;
};

export function productionToRow(p: Production, farmId: string): ProductionRow {
  return {
    id: p.id,
    farm_id: farmId,
    jour_iso: p.jourISO,
    production: p.production,
    casses: p.casses,
    perdus: 0,
    envoyes_vente: p.envoyesVente,
    notes: p.notes ?? null,
    semaine_id: p.semaineId ?? null,
    lineage_id: p.lineageId ?? null,
    archive_motif: p.archiveMotif ?? null,
    statut: p.statut,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function rowToProduction(r: ProductionRow): Production {
  return {
    id: r.id,
    farm_id: r.farm_id,
    jourISO: r.jour_iso,
    production: r.production,
    casses: r.casses,
    envoyesVente: r.envoyes_vente,
    notes: r.notes ?? undefined,
    semaineId: r.semaine_id ?? undefined,
    lineageId: r.lineage_id ?? undefined,
    archiveMotif: r.archive_motif ?? undefined,
    statut: r.statut as Production["statut"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function venteToRow(v: Vente, farmId: string): VenteRow {
  return {
    id: v.id,
    farm_id: farmId,
    jour_iso: v.jourISO,
    vendus: v.vendus,
    casses_vente: v.cassesVente,
    prix: v.prix,
    client: v.client ?? null,
    semaine_id: v.semaineId ?? null,
    lineage_id: v.lineageId ?? null,
    archive_motif: v.archiveMotif ?? null,
    statut: v.statut,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  };
}

export function rowToVente(r: VenteRow, montant: number, recuFerme: number, resteVente: number): Vente {
  return {
    id: r.id,
    farm_id: r.farm_id,
    jourISO: r.jour_iso,
    vendus: r.vendus,
    cassesVente: r.casses_vente,
    prix: r.prix,
    montant,
    client: r.client ?? undefined,
    semaineId: r.semaine_id ?? undefined,
    lineageId: r.lineage_id ?? undefined,
    archiveMotif: r.archive_motif ?? undefined,
    statut: r.statut as Vente["statut"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    recuFerme,
    resteVente,
  };
}

export function depenseToRow(d: Depense, farmId: string): DepenseRow {
  return {
    id: d.id,
    farm_id: farmId,
    jour_iso: d.jourISO,
    categorie: d.categorie,
    montant: d.montant,
    description: d.description ?? null,
    semaine_id: d.semaineId ?? null,
    lineage_id: d.lineageId ?? null,
    archive_motif: d.archiveMotif ?? null,
    statut: d.statut,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

export function rowToDepense(r: DepenseRow): Depense {
  return {
    id: r.id,
    farm_id: r.farm_id,
    jourISO: r.jour_iso,
    categorie: r.categorie,
    montant: Number(r.montant),
    description: r.description ?? undefined,
    semaineId: r.semaine_id ?? undefined,
    lineageId: r.lineage_id ?? undefined,
    archiveMotif: r.archive_motif ?? undefined,
    statut: r.statut as Depense["statut"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function tresorerieToRow(t: Tresorerie, farmId: string): TresorerieRow {
  return {
    id: t.id,
    farm_id: farmId,
    jour_iso: t.jourISO,
    montant_recu: t.montantRecu,
    depose: t.depose,
    reste: t.reste,
    methode: t.methode,
    note: t.note ?? null,
    semaine_id: t.semaineId ?? null,
    lineage_id: t.lineageId ?? null,
    archive_motif: t.archiveMotif ?? null,
    statut: t.statut,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

export function rowToTresorerie(r: TresorerieRow): Tresorerie {
  return {
    id: r.id,
    farm_id: r.farm_id,
    jourISO: r.jour_iso,
    montantRecu: Number(r.montant_recu),
    depose: Number(r.depose),
    reste: Number(r.reste),
    methode: r.methode,
    note: r.note ?? undefined,
    semaineId: r.semaine_id ?? undefined,
    lineageId: r.lineage_id ?? undefined,
    archiveMotif: r.archive_motif ?? undefined,
    statut: r.statut as Tresorerie["statut"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function transfertToRow(t: TransfertStock, farmId: string): TransfertRow {
  return {
    id: t.id,
    farm_id: farmId,
    production_id: t.productionId ?? null,
    jour_envoi_iso: t.jourEnvoiISO,
    jour_reception_iso: t.jourReceptionISO ?? null,
    quantite_envoyee: t.quantiteEnvoyee,
    quantite_recue: t.quantiteRecue ?? null,
    ecart: t.ecart ?? null,
    note_ecart: t.noteEcart ?? null,
    statut: t.statut,
    auto_confirm: t.autoConfirm,
    semaine_id: t.semaineId ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

export function rowToTransfert(r: TransfertRow): TransfertStock {
  return {
    id: r.id,
    farm_id: r.farm_id,
    productionId: r.production_id ?? undefined,
    jourEnvoiISO: r.jour_envoi_iso,
    jourReceptionISO: r.jour_reception_iso ?? undefined,
    quantiteEnvoyee: r.quantite_envoyee,
    quantiteRecue: r.quantite_recue ?? undefined,
    ecart: r.ecart ?? undefined,
    noteEcart: r.note_ecart ?? undefined,
    statut: r.statut as TransfertStock["statut"],
    autoConfirm: r.auto_confirm,
    semaineId: r.semaine_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function actionLogToRow(a: ActionLog, farmId: string): ActionLogRow {
  return {
    id: a.id,
    farm_id: farmId,
    date_iso: a.dateISO,
    type: a.type,
    module: a.module,
    cible_id: a.cibleId,
    description: a.description,
    champ: a.champ ?? null,
    ancienne_valeur:
      a.ancienneValeur === null || a.ancienneValeur === undefined
        ? null
        : String(a.ancienneValeur),
    nouvelle_valeur:
      a.nouvelleValeur === null || a.nouvelleValeur === undefined
        ? null
        : String(a.nouvelleValeur),
    utilisateur: a.utilisateur ?? null,
    created_at: a.dateISO,
  };
}

export function rowToActionLog(r: ActionLogRow): ActionLog {
  return {
    id: r.id,
    farm_id: r.farm_id,
    dateISO: r.date_iso,
    type: r.type as ActionLog["type"],
    module: r.module as ActionLog["module"],
    cibleId: r.cible_id,
    description: r.description,
    champ: r.champ ?? undefined,
    ancienneValeur: r.ancienne_valeur ?? undefined,
    nouvelleValeur: r.nouvelle_valeur ?? undefined,
    utilisateur: r.utilisateur ?? undefined,
  };
}

export type FarmStatePayload = {
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
  transferts: TransfertStock[];
  actions: ActionLog[];
  config: FarmConfig;
};
