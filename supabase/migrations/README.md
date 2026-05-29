# Migrations Supabase — LanaFarm

Dossier réservé aux migrations SQL versionnées (`supabase db push` / CLI).

## Fichiers (7 migrations)

| Fichier | Contenu |
|---------|---------|
| `00001_initial_schema.sql` | Tables métier : `farms`, `productions`, `ventes`, `depenses`, `tresorerie`, `transferts_stock`, `action_logs` |
| `00002_farm_config.sql` | `farm_profiles`, `farm_preferences`, `farm_seuils`, `categories_depense`, `methodes_paiement` |
| `00003_rls_policies.sql` | RLS activé + accès `service_role` serveur uniquement |
| `00004_farm_notifications.sql` | Table `farm_notifications` |
| `00005_farm_reports.sql` | Table `farm_reports` (rapports archivés) |
| `00006_seed_default_farm.sql` | Ferme seed UUID `f47ac10b-58cc-4372-a567-0e02b2c3d479` + config initiale |
| `00007_align_notifications_reports.sql` | FK vers `farms`, alignement RLS Option C |

## Convention

- Une migration = un changement atomique et réversible si possible
- Toujours activer RLS sur les tables exposées au client
- Colonnes `id` en `uuid` avec `gen_random_uuid()` par défaut

## État actuel

**Migrations non appliquées** — le store local (`farm-store.tsx`) reste la source V1.

Persistance Supabase côté code : `src/lib/supabase/farm-state.ts` (pas les stubs `services/`).

Pour activer (hors scope automatique) :
1. `supabase db push` (ou appliquer les 7 fichiers SQL)
2. Variables : `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LANAFARM_FARM_ID`
3. `NEXT_PUBLIC_LANAFARM_DATA_REMOTE=true`
