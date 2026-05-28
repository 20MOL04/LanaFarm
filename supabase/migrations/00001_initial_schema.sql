-- Migration 00001 — Schéma métier LanaFarm (production, ventes, dépenses, trésorerie, transferts, journal)

create extension if not exists "pgcrypto";

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  jour_iso timestamptz not null,
  production integer not null default 0 check (production >= 0),
  casses integer not null default 0 check (casses >= 0),
  perdus integer not null default 0 check (perdus >= 0),
  envoyes_vente integer not null default 0 check (envoyes_vente >= 0),
  notes text,
  semaine_id text,
  lineage_id uuid,
  archive_motif text,
  statut text not null default 'actif' check (statut in ('actif', 'annule', 'archive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists productions_farm_jour_actif_idx
  on public.productions (farm_id, jour_iso)
  where statut = 'actif';

create index if not exists productions_farm_jour_idx
  on public.productions (farm_id, jour_iso desc);

create table if not exists public.ventes (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  jour_iso timestamptz not null,
  vendus integer not null default 0 check (vendus >= 0),
  casses_vente integer not null default 0 check (casses_vente >= 0),
  prix bigint not null default 0 check (prix >= 0),
  client text,
  semaine_id text,
  lineage_id uuid,
  archive_motif text,
  statut text not null default 'actif' check (statut in ('actif', 'annule', 'archive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ventes_farm_jour_idx
  on public.ventes (farm_id, jour_iso desc);

create table if not exists public.depenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  jour_iso timestamptz not null,
  categorie text not null,
  montant bigint not null default 0 check (montant >= 0),
  description text,
  semaine_id text,
  lineage_id uuid,
  archive_motif text,
  statut text not null default 'actif' check (statut in ('actif', 'annule', 'archive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists depenses_farm_jour_idx
  on public.depenses (farm_id, jour_iso desc);

create table if not exists public.tresorerie (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  jour_iso timestamptz not null,
  montant_recu bigint not null default 0 check (montant_recu >= 0),
  depose bigint not null default 0 check (depose >= 0),
  reste bigint not null default 0,
  methode text not null,
  note text,
  semaine_id text,
  lineage_id uuid,
  archive_motif text,
  statut text not null default 'actif' check (statut in ('actif', 'annule', 'archive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tresorerie_farm_jour_idx
  on public.tresorerie (farm_id, jour_iso desc);

create table if not exists public.transferts_stock (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  production_id uuid references public.productions (id) on delete set null,
  jour_envoi_iso timestamptz not null,
  jour_reception_iso timestamptz,
  quantite_envoyee integer not null default 0 check (quantite_envoyee >= 0),
  quantite_recue integer check (quantite_recue is null or quantite_recue >= 0),
  ecart integer,
  note_ecart text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'recu', 'conteste')),
  auto_confirm boolean not null default true,
  semaine_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transferts_stock_farm_envoi_idx
  on public.transferts_stock (farm_id, jour_envoi_iso desc);

create index if not exists transferts_stock_production_idx
  on public.transferts_stock (production_id);

create table if not exists public.action_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  date_iso timestamptz not null,
  type text not null check (type in ('creation', 'modification', 'annulation', 'restauration', 'validation', 'reouverture', 'archivage')),
  module text not null check (module in ('production', 'vente', 'depense', 'tresorerie', 'transfert', 'semaine')),
  cible_id uuid not null,
  description text not null,
  champ text,
  ancienne_valeur text,
  nouvelle_valeur text,
  utilisateur text,
  created_at timestamptz not null default now()
);

create index if not exists action_logs_farm_date_idx
  on public.action_logs (farm_id, date_iso desc);
