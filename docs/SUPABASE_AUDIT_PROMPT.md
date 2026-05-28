# Prompt d'audit Supabase — LanaFarm (déploiement complet)

> **Usage** : copier ce document entier dans Claude / Cursor / un agent IA, puis lancer l'audit sur le repo `20MOL04/LanaFarm`.  
> **Objectif** : ne rien oublier avant de brancher Supabase en production (tables, RLS, auth, env, code, migrations, tests).

---

## Rôle de l'agent

Tu es un **auditeur technique senior Supabase + Next.js 16**. Tu parcours **tout le projet LanaFarm** (code, types, migrations, services, store, hooks, Vercel) et tu produis un **rapport structuré** avec :

1. **Inventaire exhaustif** (tables, colonnes, policies, env, fichiers à modifier)
2. **Écarts** (ce qui existe en SQL vs ce que le code attend)
3. **Risques sécurité** (RLS, clés, JWT, `farm_id`)
4. **Plan d'implémentation ordonné** (migrations 00001 → 00005, branchement code, tests)
5. **Checklist finale** cochable avant mise en prod

**Règles d'audit :**

- Lire `src/types/domain.ts`, `src/types/supabase-schema.ts`, `src/types/notifications.ts`, `src/types/reports.ts`
- Lire **toutes** les migrations dans `supabase/migrations/` et `supabase/migrations/README.md`
- Lire `src/contexts/farm-store.tsx` (source de vérité V1 locale)
- Lire `src/lib/kpi-sources.ts`, `src/lib/lanafarm-core.ts`, `src/lib/*-calc.ts` (règles métier — ne pas dupliquer en SQL sauf index/contraintes)
- Lire `src/services/*.ts`, `src/lib/supabase/`, `src/lib/notifications/*`, `src/lib/reports/*`
- Lire `src/lib/auth/*` (auth actuelle = cookie env `AUTH_*`, **pas** Supabase Auth aujourd'hui)
- Vérifier `package.json` : **`@supabase/supabase-js` absent** — à installer
- Ne pas inventer de tables : chaque table proposée doit être **référencée** par un type ou un commentaire du repo
- RLS obligatoire sur tout schéma `public` exposé au client
- Signaler les colonnes **@derived** du domaine qui ne doivent **pas** être persistées en DB

---

## Contexte produit LanaFarm

Application de gestion avicole (Guinée, GNF) :

| Module | Entités | Unités persistance |
|--------|---------|-------------------|
| Production | `Production`, `TransfertStock` | œufs (`production`, `envoyesVente`, `casses`, `perdus`) |
| Ventes | `Vente` | œufs (`vendus`, `cassesVente`), `prix` GNF |
| Dépenses | `Depense` | GNF, `categorie` (slug ou UUID) |
| Trésorerie | `Tresorerie` | GNF (`montantRecu`, `depose`, `reste`) |
| Config | `FarmConfig` | profil, préférences, seuils, listes |
| Notifications | `AppNotification` | cloche, règles dans `notification-rules.ts` |
| Rapports | `ReportDocument` / `ReportPayload` | snapshot JSON archivé |
| Historique | `ActionLog` | journal mutations |

**Statuts communs** : `EntreeStatut` = `actif` | `annule` | `archive`  
**Archivage R6C** : `lineageId`, `archiveMotif` — versions liées (production/vente/dépense/trésorerie)

**Ferme V1** : mono-site, `DEFAULT_FARM_ID = "local-farm-v1"` dans `src/types/notifications.ts` — en Supabase ce doit devenir un **`uuid` ferme réel**.

---

## Phase 1 — Inventaire des migrations SQL

### Existant (fichiers présents)

| Fichier | Statut | Contenu |
|---------|--------|---------|
| `00004_farm_notifications.sql` | ✅ écrit | `farm_notifications` + RLS `auth.jwt() ->> 'farm_id'` |
| `00005_farm_reports.sql` | ✅ écrit | `farm_reports` + RLS |
| `00001_initial_schema.sql` | ❌ **manquant** | tables métier |
| `00002_farm_config.sql` | ❌ **manquant** | config ferme |
| `00003_rls_policies.sql` | ❌ **manquant** | RLS global (si pas dans chaque migration) |

**Tâche audit** : pour chaque fichier manquant, lister le SQL attendu colonne par colonne en croisant `domain.ts`.

### Tables métier à valider (00001 cible)

D'après `domain.ts` + README migrations :

#### `farms` (table parente — **à créer si absente**)

- `id uuid PK`
- `name text`, `created_at`, `updated_at`
- Toutes les autres tables référencent `farm_id uuid NOT NULL → farms(id)`

#### `productions`

| Colonne SQL | Type TS | Notes |
|-------------|---------|-------|
| id | string → uuid | PK |
| farm_id | string? → uuid | RLS |
| jour_iso | jourISO | timestamptz, index (farm_id, jour_iso) |
| production | number | œufs ramassés |
| casses | number | œufs |
| perdus | number | default 0 |
| envoyes_vente | number | œufs envoyés magasin |
| notes | text? | |
| semaine_id | text? | legacy, nullable |
| lineage_id | uuid? | archivage |
| archive_motif | text? | |
| statut | EntreeStatut | check constraint |
| created_at, updated_at | timestamptz | |

**Ne PAS stocker** : alvéoles restantes (calcul `production-calc.ts`)

#### `ventes`

| Colonne | Notes |
|---------|-------|
| vendus, casses_vente | œufs |
| prix | GNF entier |
| client | text nullable |
| **Ne PAS stocker** | `montant`, `recuFerme`, `resteVente` (@derived — `sales-calc.ts`) |

#### `depenses`

| Colonne | Notes |
|---------|-------|
| categorie | text (slug seed ou FK `categories_depense`) |
| montant | GNF |
| description | text? |

#### `tresorerie`

| Colonne | Notes |
|---------|-------|
| montant_recu, depose, reste | GNF — valider si `reste` est calculé ou stocké |
| methode | text (slug ou FK `methodes_paiement`) |
| note | text? |

#### `transferts_stock`

| Colonne | Notes |
|---------|-------|
| production_id | uuid nullable (transfert manuel) |
| jour_envoi_iso, jour_reception_iso | |
| quantite_envoyee, quantite_recue, ecart | œufs |
| note_ecart | text? |
| statut | en_attente \| recu \| conteste |
| auto_confirm | boolean |

**Index** : `(farm_id, jour_envoi_iso)`, `(production_id)`

#### `action_logs` (historique — **souvent oublié**)

D'après `ActionLog` dans `domain.ts` :

- id, farm_id?, date_iso, type, module, cible_id, description
- champ, ancienne_valeur, nouvelle_valeur, utilisateur
- Index `(farm_id, date_iso desc)`

### Tables config (00002 cible)

D'après `supabase-schema.ts` + commentaires `domain.ts` :

| Table | Champs |
|-------|--------|
| `farm_profiles` | farm_id PK, nom, ville, telephone |
| `farm_preferences` | farm_id PK, prix_plateau_gnf, capacite_plateau |
| `farm_seuils` | farm_id PK, stock_magasin_faible_plateaux, tresorerie_en_attente_max_gnf, pertes_hebdo_max_pct |
| `categories_depense` | id, label, actif, is_default, farm_id |
| `methodes_paiement` | id, label, actif, is_default, farm_id |

**Seed** : reproduire `CATEGORIES_DEPENSES`, `METHODES_TRESORERIE`, `DEFAULT_FARM_CONFIG` depuis `src/lib/config-defaults.ts`

### Tables déjà migrées

#### `farm_notifications` (00004)

- Vérifier mapping `notification-mapper.ts` ↔ colonnes
- Index unique partiel `(farm_id, notification_key) WHERE resolved_at IS NULL AND dismissed_at IS NULL`
- **Manque policy DELETE ?** — vérifier besoins UI

#### `farm_reports` (00005)

- `payload_json` = snapshot `ReportPayload` complet
- Vérifier `report-mapper.ts`, limite historique (10 en local)

---

## Phase 2 — Auth & `farm_id` (point critique)

### État actuel app

| Composant | Implémentation |
|-----------|----------------|
| Login | `AUTH_EMAIL`, `AUTH_PASSWORD`, `AUTH_SESSION_TOKEN` (cookie custom, `middleware.ts`) |
| Supabase client | `src/lib/supabase/client.ts` → **`null`**, TODO |
| RLS migrations | `auth.jwt() ->> 'farm_id'` |

### Décision à trancher (l'audit DOIT recommander une option)

**Option A — Garder auth Vercel/env + service_role côté serveur uniquement**  
- Next.js Route Handlers / Server Actions avec `SUPABASE_SERVICE_ROLE_KEY`  
- Pas de RLS côté client anon  
- Plus simple court terme, moins « Supabase native »

**Option B — Migrer vers Supabase Auth**  
- `auth.users` + `app_metadata.farm_id` (pas `user_metadata` — éditable)  
- JWT avec claim `farm_id` pour RLS existant  
- Custom claims via hook ou `raw_app_meta_data`  
- Remplacer ou compléter `middleware.ts`

**Option C — Hybride V1**  
- Auth login reste `AUTH_*`  
- API routes serveur injectent `farm_id` fixe (mono-ferme) via service role  
- Préparer RLS pour V2 multi-fermes

**Tâche audit** : choisir une option cohérente avec les policies 00004/00005 et documenter les changements `middleware.ts` / hooks.

---

## Phase 3 — Code à brancher (inventaire fichiers)

### Packages npm manquants

```bash
npm install @supabase/supabase-js
# Si SSR cookies : @supabase/ssr
```

### Client & types

| Fichier | Action |
|---------|--------|
| `src/lib/supabase/client.ts` | Implémenter `createClient` browser |
| `src/lib/supabase/server.ts` | **À créer** — client serveur (cookies ou service role) |
| `src/lib/supabase/types.ts` | Générer via `supabase gen types` après migrations |

### Services (stubs vides ou TODO)

| Service | Table(s) cible |
|---------|----------------|
| `production.service.ts` | productions, transferts_stock |
| `ventes.service.ts` | ventes |
| `depenses.service.ts` | depenses |
| `tresorerie.service.ts` | tresorerie |
| `transferts.service.ts` | transferts_stock |
| `config.service.ts` | farm_profiles, farm_preferences, farm_seuils, categories_depense, methodes_paiement |
| `notifications.service.ts` | farm_notifications (TODOs présents) |
| `reports.service.ts` | farm_reports |

### Repositories & feature flags

| Fichier | Flag env |
|---------|----------|
| `notification-storage.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_NOTIFICATIONS_REMOTE=true` |
| `report-storage.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_REPORTS_REMOTE=true` |

**Tâche audit** : le store principal `farm-store.tsx` est encore **100 % mémoire + seed** — plan de migration progressive ou big-bang ?

### Fichiers à ne pas oublier pour remplacement localStorage

| Clé localStorage | Remplacement Supabase |
|------------------|----------------------|
| `lanafarm-notifications-v1` | `farm_notifications` |
| `lanafarm-reports-v1` | `farm_reports` |
| Store React (`farm-store`) | tables métier + hydratation initiale |

`lanafarm:sidebar-collapsed` → peut rester local

---

## Phase 4 — Variables d'environnement

### Vercel (Production + Preview)

| Variable | Obligatoire | Secret | Usage |
|----------|-------------|--------|-------|
| `AUTH_EMAIL` | oui (auth actuelle) | oui | Login |
| `AUTH_PASSWORD` | oui | oui | Login |
| `AUTH_SESSION_TOKEN` | oui | oui | Cookie session |
| `NEXT_PUBLIC_SUPABASE_URL` | pour Supabase | non | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pour Supabase | non (publishable) | Client RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | si serveur | **oui, jamais NEXT_PUBLIC** | Bypass RLS admin |
| `NEXT_PUBLIC_NOTIFICATIONS_REMOTE` | optionnel | non | `true` = remote |
| `NEXT_PUBLIC_REPORTS_REMOTE` | optionnel | non | `true` = remote |

### Local `.env.local` (exemple — ne pas committer)

```env
AUTH_EMAIL=
AUTH_PASSWORD=
AUTH_SESSION_TOKEN=

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_NOTIFICATIONS_REMOTE=false
NEXT_PUBLIC_REPORTS_REMOTE=false
```

**Tâche audit** : vérifier qu'aucune clé service n'est préfixée `NEXT_PUBLIC_`.

---

## Phase 5 — RLS & sécurité (checklist Supabase)

Pour **chaque table** `public` :

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Policy `SELECT` avec `farm_id = (auth.jwt() ->> 'farm_id')::uuid` **ou** équivalent service role
- [ ] Policy `INSERT` avec `WITH CHECK` même `farm_id`
- [ ] Policy `UPDATE` : **nécessite aussi policy `SELECT`** (sinon 0 rows silencieux)
- [ ] Policy `DELETE` si l'UI annule/supprime
- [ ] Pas de `service_role` dans le navigateur
- [ ] Vues éventuelles : `SECURITY INVOKER` (Postgres 15+)
- [ ] Advisors Supabase : `supabase db advisors` / MCP `get_advisors`

**Tables 00004/00005** : policies déjà écrites — vérifier compatibilité avec l'option auth choisie.

---

## Phase 6 — Contraintes métier & intégrité

L'audit doit vérifier si SQL doit refléter :

| Règle app | Fichier source | Contrainte SQL ? |
|-----------|----------------|------------------|
| 1 production active / jour | `multi-day.ts`, `farm-store` | UNIQUE `(farm_id, jour_iso) WHERE statut = 'actif'` ? |
| `envoyesVente` ≤ `production` | `production-calc.ts` validation | CHECK ou trigger ? |
| Vente stock ≤ stock magasin | `sales-calc.ts`, `transfers-calc.ts` | app-only ou trigger |
| Transfert auto si `envoyesVente > 0` | `farm-store` reducer | trigger optionnel |
| Alvéoles entières UI | `units.ts`, validation | CHECK `production % capacite = 0` ? (si capacite fixe 30) |
| `capacite_plateau` | `farm_preferences` | utilisé pour affichage, pas en table production |

---

## Phase 7 — Realtime & performance (optionnel V1)

| Feature | Fichier | Priorité |
|---------|---------|----------|
| Realtime notifications | `notifications.service.ts` TODO channel | P2 |
| Index dates | toutes tables `jour_*` | P1 |
| Pagination tables UI | `data-table` | P2 |
| Export PDF/Excel | local, pas Supabase | N/A |

---

## Phase 8 — Plan de migration données seed → Supabase

1. Créer projet Supabase (région proche utilisateurs)
2. `supabase link` + appliquer migrations `00001` → `00005` dans l'ordre
3. Seed : 1 ferme, config, catégories, méthodes
4. Script one-shot : importer logique `seedInitialState()` (`farm-store.tsx`) en SQL ou script TS admin
5. Brancher `farm-store` : hydratation au load + mutations async
6. Activer flags remote notifications/reports
7. Tests E2E manuels par module

---

## Phase 9 — Tests de validation (checklist manuelle)

Cocher après branchement :

### Config / Paramètres
- [ ] Profil, préférences, seuils chargés depuis Supabase
- [ ] Catégories / méthodes CRUD
- [ ] `capacitePlateau` utilisé partout (KPI, ventes, rapports)

### Production
- [ ] Créer / modifier / annuler jour
- [ ] Multi-jours sans conflit
- [ ] Envoi stock → transfert `recu` auto
- [ ] KPI alvéoles entières

### Ventes
- [ ] Vente + prix casier → montant correct
- [ ] Stock magasin cohérent avec transferts

### Dépenses & Trésorerie
- [ ] Dépense par catégorie
- [ ] Versement + reste à verser

### Notifications
- [ ] Règles génèrent alertes
- [ ] Persistance après refresh (plus localStorage seul)
- [ ] Lu / non lu

### Rapports
- [ ] Générer + archiver + historique 10
- [ ] Export PDF/Excel depuis snapshot

### Auth & déploiement
- [ ] Login Vercel prod
- [ ] Pas de fuite `SERVICE_ROLE`
- [ ] 2 navigateurs / sessions (si multi-user futur)

---

## Format de livrable attendu de l'agent

```markdown
# Rapport audit Supabase — LanaFarm
## Résumé exécutif (10 lignes)
## Matrice tables (existe / manquant / partiel)
## Écarts code ↔ SQL (table détaillée)
## Décision auth recommandée (A/B/C) + justification
## Liste migrations à écrire (00001, 00002, 00003 + correctifs 00004/00005)
## Variables env complètes
## Plan en 10–15 tâches ordonnées (avec estimations S/M/L)
## Risques P0 / P1 / P2
## Checklist pré-prod finale
```

---

## Fichiers obligatoires à parcourir (ne rien sauter)

```
src/types/domain.ts
src/types/supabase-schema.ts
src/types/notifications.ts
src/types/reports.ts
src/contexts/farm-store.tsx
src/lib/kpi-sources.ts
src/lib/lanafarm-core.ts
src/lib/production-calc.ts
src/lib/sales-calc.ts
src/lib/transfers-calc.ts
src/lib/notifications/notification-rules.ts
src/lib/notifications/notification-mapper.ts
src/lib/reports/report-mapper.ts
src/lib/config-defaults.ts
src/lib/supabase/client.ts
src/services/*.ts
src/lib/auth/*
middleware.ts
supabase/migrations/*
package.json
.env.example (créer si absent pour Supabase)
```

---

## Notes connues (ne pas re-auditer comme bug)

- Auth login = env vars (pas Supabase Auth) tant que non migré
- `@supabase/supabase-js` non installé
- Services production/config/ventes = fichiers vides `export {}`
- Migrations 00001–00003 documentées dans README mais **non créées**
- `Vente.montant`, `recuFerme`, `resteVente` = dérivés, pas colonnes DB
- App déployée Vercel : `20MOL04/LanaFarm` — variables `AUTH_*` déjà requises

---

*Fin du prompt — version alignée sur le repo LanaFarm au 28/05/2026.*
