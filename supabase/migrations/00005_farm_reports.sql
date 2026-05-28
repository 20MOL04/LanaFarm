-- Migration 00005 — Rapports archivés (générateur / export)

create table if not exists public.farm_reports (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  report_type text not null check (report_type in ('weekly', 'monthly', 'custom')),
  period_label text not null,
  period_from timestamptz not null,
  period_to timestamptz not null,
  payload_json jsonb not null,
  generated_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists farm_reports_farm_generated_idx
  on public.farm_reports (farm_id, generated_at desc);

alter table public.farm_reports enable row level security;

create policy "farm_reports_select_own"
  on public.farm_reports for select
  using (farm_id = (auth.jwt() ->> 'farm_id')::uuid);

create policy "farm_reports_insert_own"
  on public.farm_reports for insert
  with check (farm_id = (auth.jwt() ->> 'farm_id')::uuid);

create policy "farm_reports_delete_own"
  on public.farm_reports for delete
  using (farm_id = (auth.jwt() ->> 'farm_id')::uuid);
