-- Migration 00002 — Configuration ferme (profil, préférences, seuils, listes)

create table if not exists public.farm_profiles (
  farm_id uuid primary key references public.farms (id) on delete cascade,
  nom text not null,
  ville text not null default '',
  telephone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_preferences (
  farm_id uuid primary key references public.farms (id) on delete cascade,
  prix_plateau_gnf bigint not null default 37000,
  capacite_plateau integer not null default 30 check (capacite_plateau > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_seuils (
  farm_id uuid primary key references public.farms (id) on delete cascade,
  stock_magasin_faible_plateaux integer not null default 20,
  tresorerie_en_attente_max_gnf bigint not null default 1000000,
  pertes_hebdo_max_pct numeric(5, 2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories_depense (
  id text not null,
  farm_id uuid not null references public.farms (id) on delete cascade,
  label text not null,
  actif boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, id)
);

create table if not exists public.methodes_paiement (
  id text not null,
  farm_id uuid not null references public.farms (id) on delete cascade,
  label text not null,
  actif boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (farm_id, id)
);
