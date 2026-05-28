-- Migration 00004 — Centre de notifications (cloche)
-- Table miroir de AppNotification (src/types/notifications.ts)

create table if not exists public.farm_notifications (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  notification_key text not null,
  level text not null check (level in ('critical', 'important', 'normal', 'positive')),
  module text not null,
  title text not null,
  description text not null,
  href text not null,
  query_json jsonb,
  meta_json jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  resolved_at timestamptz
);

create index if not exists farm_notifications_farm_created_idx
  on public.farm_notifications (farm_id, created_at desc);

create unique index if not exists farm_notifications_farm_key_active_idx
  on public.farm_notifications (farm_id, notification_key)
  where resolved_at is null and dismissed_at is null;

alter table public.farm_notifications enable row level security;

-- RLS : accès limité à la ferme de l'utilisateur connecté (à ajuster selon auth JWT)
create policy "farm_notifications_select_own"
  on public.farm_notifications for select
  using (farm_id = (auth.jwt() ->> 'farm_id')::uuid);

create policy "farm_notifications_insert_own"
  on public.farm_notifications for insert
  with check (farm_id = (auth.jwt() ->> 'farm_id')::uuid);

create policy "farm_notifications_update_own"
  on public.farm_notifications for update
  using (farm_id = (auth.jwt() ->> 'farm_id')::uuid);
