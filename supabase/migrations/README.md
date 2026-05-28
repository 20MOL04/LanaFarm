# Migrations Supabase — LanaFarm

Dossier réservé aux migrations SQL versionnées (`supabase db push` / CLI).

## Structure prévue

- `00001_initial_schema.sql` — tables métier (`productions`, `ventes`, `depenses`, …)
- `00002_farm_config.sql` — `farm_profiles`, `farm_preferences`, `farm_seuils`, listes
- `00003_rls_policies.sql` — Row Level Security par `farm_id`
- `00004_farm_notifications.sql` — centre de notifications (cloche), RLS par `farm_id`
- `00005_farm_reports.sql` — rapports archivés (générateur / export), RLS par `farm_id`

## Convention

- Une migration = un changement atomique et réversible si possible
- Toujours activer RLS sur les tables exposées au client
- Colonnes `id` en `uuid` avec `gen_random_uuid()` par défaut

## État actuel

Aucune migration appliquée — le store local (`farm-store.tsx`) reste la source V1.
