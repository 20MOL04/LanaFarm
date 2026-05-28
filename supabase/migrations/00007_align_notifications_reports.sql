-- Migration 00007 — FK vers farms + RLS aligné Option C (serveur uniquement)

alter table public.farm_notifications
  drop constraint if exists farm_notifications_farm_id_fkey;

alter table public.farm_notifications
  add constraint farm_notifications_farm_id_fkey
  foreign key (farm_id) references public.farms (id) on delete cascade;

alter table public.farm_reports
  drop constraint if exists farm_reports_farm_id_fkey;

alter table public.farm_reports
  add constraint farm_reports_farm_id_fkey
  foreign key (farm_id) references public.farms (id) on delete cascade;

drop policy if exists "farm_notifications_select_own" on public.farm_notifications;
drop policy if exists "farm_notifications_insert_own" on public.farm_notifications;
drop policy if exists "farm_notifications_update_own" on public.farm_notifications;

drop policy if exists "farm_reports_select_own" on public.farm_reports;
drop policy if exists "farm_reports_insert_own" on public.farm_reports;
drop policy if exists "farm_reports_delete_own" on public.farm_reports;

revoke all on table public.farm_notifications from anon, authenticated;
revoke all on table public.farm_reports from anon, authenticated;
