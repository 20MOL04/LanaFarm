import "server-only";

import { DEFAULT_FARM_CONFIG } from "@/lib/config-defaults";
import { computeVenteSnapshot } from "@/lib/sales-calc";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  actionLogToRow,
  depenseToRow,
  productionToRow,
  rowToActionLog,
  rowToDepense,
  rowToProduction,
  rowToTransfert,
  rowToTresorerie,
  rowToVente,
  transfertToRow,
  tresorerieToRow,
  venteToRow,
  type ActionLogRow,
  type DepenseRow,
  type FarmStatePayload,
  type ProductionRow,
  type TransfertRow,
  type TresorerieRow,
  type VenteRow,
} from "@/lib/supabase/farm-mappers";
import type { FarmConfig } from "@/types/domain";

async function loadConfig(farmId: string): Promise<FarmConfig> {
  const db = getSupabaseAdmin();

  const [profilRes, prefsRes, seuilsRes, catsRes, methRes] = await Promise.all([
    db.from("farm_profiles").select("*").eq("farm_id", farmId).maybeSingle(),
    db.from("farm_preferences").select("*").eq("farm_id", farmId).maybeSingle(),
    db.from("farm_seuils").select("*").eq("farm_id", farmId).maybeSingle(),
    db.from("categories_depense").select("*").eq("farm_id", farmId),
    db.from("methodes_paiement").select("*").eq("farm_id", farmId),
  ]);

  if (profilRes.error) throw profilRes.error;
  if (prefsRes.error) throw prefsRes.error;
  if (seuilsRes.error) throw seuilsRes.error;
  if (catsRes.error) throw catsRes.error;
  if (methRes.error) throw methRes.error;

  if (!profilRes.data || !prefsRes.data || !seuilsRes.data) {
    return DEFAULT_FARM_CONFIG;
  }

  const p = profilRes.data;
  const pr = prefsRes.data;
  const s = seuilsRes.data;

  return {
    profil: {
      nom: p.nom,
      ville: p.ville,
      telephone: p.telephone,
    },
    preferences: {
      prixPlateauGNF: Number(pr.prix_plateau_gnf),
      capacitePlateau: pr.capacite_plateau,
    },
    seuils: {
      stockMagasinFaiblePlateaux: s.stock_magasin_faible_plateaux,
      tresorerieEnAttenteMaxGNF: Number(s.tresorerie_en_attente_max_gnf),
      pertesHebdoMaxPct: Number(s.pertes_hebdo_max_pct),
    },
    listes: {
      categoriesDepense: (catsRes.data ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        actif: c.actif,
        isDefault: c.is_default,
      })),
      methodesPaiement: (methRes.data ?? []).map((m) => ({
        id: m.id,
        label: m.label,
        actif: m.actif,
        isDefault: m.is_default,
      })),
    },
  };
}

async function saveConfig(farmId: string, config: FarmConfig): Promise<void> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: profilErr } = await db.from("farm_profiles").upsert({
    farm_id: farmId,
    nom: config.profil.nom,
    ville: config.profil.ville,
    telephone: config.profil.telephone,
    updated_at: now,
  });
  if (profilErr) throw profilErr;

  const { error: prefsErr } = await db.from("farm_preferences").upsert({
    farm_id: farmId,
    prix_plateau_gnf: config.preferences.prixPlateauGNF,
    capacite_plateau: config.preferences.capacitePlateau,
    updated_at: now,
  });
  if (prefsErr) throw prefsErr;

  const { error: seuilsErr } = await db.from("farm_seuils").upsert({
    farm_id: farmId,
    stock_magasin_faible_plateaux: config.seuils.stockMagasinFaiblePlateaux,
    tresorerie_en_attente_max_gnf: config.seuils.tresorerieEnAttenteMaxGNF,
    pertes_hebdo_max_pct: config.seuils.pertesHebdoMaxPct,
    updated_at: now,
  });
  if (seuilsErr) throw seuilsErr;

  await db.from("categories_depense").delete().eq("farm_id", farmId);
  if (config.listes.categoriesDepense.length > 0) {
    const { error } = await db.from("categories_depense").insert(
      config.listes.categoriesDepense.map((c) => ({
        farm_id: farmId,
        id: c.id,
        label: c.label,
        actif: c.actif,
        is_default: c.isDefault,
        updated_at: now,
      }))
    );
    if (error) throw error;
  }

  await db.from("methodes_paiement").delete().eq("farm_id", farmId);
  if (config.listes.methodesPaiement.length > 0) {
    const { error } = await db.from("methodes_paiement").insert(
      config.listes.methodesPaiement.map((m) => ({
        farm_id: farmId,
        id: m.id,
        label: m.label,
        actif: m.actif,
        is_default: m.isDefault,
        updated_at: now,
      }))
    );
    if (error) throw error;
  }
}

export async function loadFarmState(farmId: string): Promise<FarmStatePayload> {
  const db = getSupabaseAdmin();

  const [prodRes, venteRes, depRes, tresRes, transRes, logRes, config] = await Promise.all([
    db.from("productions").select("*").eq("farm_id", farmId).order("jour_iso", { ascending: false }),
    db.from("ventes").select("*").eq("farm_id", farmId).order("jour_iso", { ascending: false }),
    db.from("depenses").select("*").eq("farm_id", farmId).order("jour_iso", { ascending: false }),
    db.from("tresorerie").select("*").eq("farm_id", farmId).order("jour_iso", { ascending: false }),
    db.from("transferts_stock").select("*").eq("farm_id", farmId).order("jour_envoi_iso", { ascending: false }),
    db.from("action_logs").select("*").eq("farm_id", farmId).order("date_iso", { ascending: false }),
    loadConfig(farmId),
  ]);

  for (const res of [prodRes, venteRes, depRes, tresRes, transRes, logRes]) {
    if (res.error) throw res.error;
  }

  const productions = (prodRes.data as ProductionRow[]).map(rowToProduction);
  const capacite = config.preferences.capacitePlateau;

  const ventes = (venteRes.data as VenteRow[]).map((row) => {
    const snap = computeVenteSnapshot(
      {
        jourISO: row.jour_iso,
        vendus: row.vendus,
        cassesVente: row.casses_vente,
        prix: Number(row.prix),
      },
      productions,
      [],
      capacite
    );
    return rowToVente(row, snap.montant, snap.recuFerme, snap.resteVente);
  });

  return {
    productions,
    ventes,
    depenses: (depRes.data as DepenseRow[]).map(rowToDepense),
    tresorerie: (tresRes.data as TresorerieRow[]).map(rowToTresorerie),
    transferts: (transRes.data as TransfertRow[]).map(rowToTransfert),
    actions: (logRes.data as ActionLogRow[]).map(rowToActionLog),
    config,
  };
}

export async function saveFarmState(
  farmId: string,
  payload: FarmStatePayload
): Promise<void> {
  const db = getSupabaseAdmin();

  const tables = [
    "action_logs",
    "transferts_stock",
    "tresorerie",
    "depenses",
    "ventes",
    "productions",
  ] as const;

  for (const table of tables) {
    const { error } = await db.from(table).delete().eq("farm_id", farmId);
    if (error) throw error;
  }

  if (payload.productions.length > 0) {
    const { error } = await db
      .from("productions")
      .insert(payload.productions.map((p) => productionToRow(p, farmId)));
    if (error) throw error;
  }

  if (payload.ventes.length > 0) {
    const { error } = await db
      .from("ventes")
      .insert(payload.ventes.map((v) => venteToRow(v, farmId)));
    if (error) throw error;
  }

  if (payload.depenses.length > 0) {
    const { error } = await db
      .from("depenses")
      .insert(payload.depenses.map((d) => depenseToRow(d, farmId)));
    if (error) throw error;
  }

  if (payload.tresorerie.length > 0) {
    const { error } = await db
      .from("tresorerie")
      .insert(payload.tresorerie.map((t) => tresorerieToRow(t, farmId)));
    if (error) throw error;
  }

  if (payload.transferts.length > 0) {
    const { error } = await db
      .from("transferts_stock")
      .insert(payload.transferts.map((t) => transfertToRow(t, farmId)));
    if (error) throw error;
  }

  if (payload.actions.length > 0) {
    const { error } = await db
      .from("action_logs")
      .insert(payload.actions.map((a) => actionLogToRow(a, farmId)));
    if (error) throw error;
  }

  await saveConfig(farmId, payload.config);
}
