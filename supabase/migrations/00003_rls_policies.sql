-- Migration 00003 — RLS (V1 : accès via service_role côté serveur uniquement)
-- Pas de policy pour anon/authenticated → refus par défaut sur l'API Data publique.

alter table public.farms enable row level security;
alter table public.productions enable row level security;
alter table public.ventes enable row level security;
alter table public.depenses enable row level security;
alter table public.tresorerie enable row level security;
alter table public.transferts_stock enable row level security;
alter table public.action_logs enable row level security;
alter table public.farm_profiles enable row level security;
alter table public.farm_preferences enable row level security;
alter table public.farm_seuils enable row level security;
alter table public.categories_depense enable row level security;
alter table public.methodes_paiement enable row level security;

revoke all on table public.farms from anon, authenticated;
revoke all on table public.productions from anon, authenticated;
revoke all on table public.ventes from anon, authenticated;
revoke all on table public.depenses from anon, authenticated;
revoke all on table public.tresorerie from anon, authenticated;
revoke all on table public.transferts_stock from anon, authenticated;
revoke all on table public.action_logs from anon, authenticated;
revoke all on table public.farm_profiles from anon, authenticated;
revoke all on table public.farm_preferences from anon, authenticated;
revoke all on table public.farm_seuils from anon, authenticated;
revoke all on table public.categories_depense from anon, authenticated;
revoke all on table public.methodes_paiement from anon, authenticated;
