# Rapport audit Supabase — LanaFarm

**Date** : 28 mai 2026  
**Repo** : `20MOL04/LanaFarm`  
**Périmètre** : code, migrations SQL, auth, env, déploiement Vercel

---

## Résumé exécutif

LanaFarm fonctionne aujourd’hui **à 100 % en mémoire** (`farm-store.tsx` + seed) avec persistance locale partielle (notifications et rapports en `localStorage`). Seules **2 migrations SQL** existent (`farm_notifications`, `farm_reports`) ; les **3 migrations fondamentales** (`00001` métier, `00002` config, `00003` RLS) sont **absentes**. Le package `@supabase/supabase-js` n’est **pas installé** ; le client Supabase est `null`. L’auth production repose sur un **cookie custom** (`AUTH_EMAIL` / `AUTH_PASSWORD` / `AUTH_SESSION_TOKEN`), alors que les policies RLS des migrations 00004/00005 supposent un JWT `auth.jwt() ->> 'farm_id'` — **incompatibilité bloquante** si on applique les migrations telles quelles sans adapter l’auth. **Recommandation** : **Option C (hybride V1)** — garder le login actuel, accès Supabase **uniquement côté serveur** (Route Handlers + `SUPABASE_SERVICE_ROLE_KEY` + `farm_id` fixe en env), puis migrer vers Supabase Auth en V2. Ordre de travail : écrire `00001`–`00003`, corriger RLS 00004/00005, installer le SDK, brancher le store module par module, seed Supabase, tests checklist Phase 9.

---

## Matrice tables

| Table | Migration | Statut SQL | Types TS | Code branché |
|-------|-----------|------------|----------|--------------|
| `farms` | 00001 | ❌ manquant | ❌ absent | ❌ |
| `productions` | 00001 | ❌ manquant | `Production` | store only |
| `ventes` | 00001 | ❌ manquant | `Vente` | store only |
| `depenses` | 00001 | ❌ manquant | `Depense` | store only |
| `tresorerie` | 00001 | ❌ manquant | `Tresorerie` | store only |
| `transferts_stock` | 00001 | ❌ manquant | `TransfertStock` | store only |
| `action_logs` | 00001 | ❌ manquant | `ActionLog` (sans `farm_id`!) | store only |
| `farm_profiles` | 00002 | ❌ manquant | `FarmProfileRow` | store only |
| `farm_preferences` | 00002 | ❌ manquant | `FarmPreferencesRow` | store only |
| `farm_seuils` | 00002 | ❌ manquant | `FarmSeuilsRow` | store only |
| `categories_depense` | 00002 | ❌ manquant | `CategorieDepenseRow` | store only |
| `methodes_paiement` | 00002 | ❌ manquant | `MethodePaiementRow` | store only |
| `farm_notifications` | 00004 | ✅ présent | `FarmNotificationRow` | stub repo |
| `farm_reports` | 00005 | ✅ présent | `FarmReportRow` | stub repo |

**Légende** : store only = `farm-store.tsx` + `seedInitialState()`, pas Supabase.

---

## Écarts code ↔ SQL (détaillé)

### `productions`

| Domaine (`Production`) | SQL proposé | Écart / action |
|------------------------|-------------|----------------|
| `id` string | `uuid` PK | Mapper à la lecture/écriture |
| `farm_id?` optional | `farm_id uuid NOT NULL` | **Obligatoire** en DB ; assigner à chaque insert |
| `jourISO` | `jour_iso timestamptz` | Nom snake_case + index `(farm_id, jour_iso)` |
| `production`, `casses`, `perdus`, `envoyesVente` | idem | Unité **œufs** (OK) |
| `notes`, `semaineId`, `lineageId`, `archiveMotif`, `statut` | idem | CHECK `statut IN ('actif','annule','archive')` |
| — | UNIQUE partiel | `(farm_id, jour_iso) WHERE statut = 'actif'` recommandé (`multi-day.ts`) |
| alvéoles restantes | — | **Ne pas créer** — `production-calc.ts` |

### `ventes`

| Domaine (`Vente`) | SQL | Écart |
|-------------------|-----|-------|
| `vendus`, `cassesVente`, `prix`, `client` | ✅ colonnes | |
| `montant` | ❌ **ne pas créer** | Commentaire domaine @derived ; encore rempli en mémoire via `computeVenteSnapshot` |
| `recuFerme`, `resteVente` | ❌ **ne pas créer** | @deprecated, recalcul `buildSaleRowViews()` |
| `semaineId`, `lineageId`, `archiveMotif`, `statut` | ✅ | |

**Note** : en mémoire, `montant` est encore persisté sur l’objet `Vente` pour snapshots UI — en DB, recalculer avec `calcSaleLineMontant(vendus, prix, capacite)`.

### `depenses`

| Domaine | SQL | Écart |
|---------|-----|-------|
| `categorie` string slug | `text` ou FK → `categories_depense.id` | V1 : `text` suffit ; V2 : FK si UUID custom |
| `montant`, `description`, `statut`, archivage | ✅ | |

### `tresorerie`

| Domaine | SQL | Écart |
|---------|-----|-------|
| `montantRecu`, `depose`, `reste` | ✅ | `reste` = `montant_recu - depose` — peut rester colonne stockée (comme seed) ou GENERATED |
| `methode` | `text` | Aligné slugs `METHODES_TRESORERIE` |

### `transferts_stock`

| Domaine | SQL | Écart |
|---------|-----|-------|
| Tous champs | ✅ | `production_id` nullable (envoi manuel `send-stock-dialog`) |
| `statut` | CHECK | `en_attente`, `recu`, `conteste` |
| `auto_confirm` | boolean | V1 = true (`TRANSFERT_AUTO_CONFIRM`) |

### `action_logs`

| Domaine (`ActionLog`) | SQL | Écart |
|-----------------------|-----|-------|
| Pas de `farm_id` dans TS | **`farm_id uuid NOT NULL` recommandé** | Ajouter au type TS + RLS |
| `module` | `text` | Valeurs : production, vente, depense, tresorerie, transfert, semaine |
| `utilisateur` | `text` nullable | Pas lié Supabase Auth aujourd’hui |

### Config (`00002`)

| TS (`supabase-schema.ts`) | SQL | Écart |
|---------------------------|-----|-------|
| `farm_profiles` | PK `farm_id` | 1 ligne / ferme |
| `farm_preferences` | `prix_plateau_gnf`, `capacite_plateau` | |
| `farm_seuils` | 3 colonnes seuils | Consommées par `notification-rules.ts` |
| `categories_depense` | `id text` PK composite ? | Utiliser `(farm_id, id)` PK ou `id uuid` + unique `(farm_id, slug)` |
| `methodes_paiement` | idem | Seeds : `config-defaults.ts` |

**Écart doc** : `domain.ts` mentionne encore `farm_config` mono-ligne — **obsolète** ; cible = tables séparées ci-dessus.

### `farm_notifications` (00004)

| Mapper | SQL | Écart |
|--------|-----|-------|
| `key` ↔ `notification_key` | ✅ | |
| `query` ↔ `query_json` | ✅ | |
| `meta` ↔ `meta_json` | ✅ | |
| RLS JWT `farm_id` | ✅ | **Incompatible** avec auth cookie actuelle |
| DELETE policy | ❌ absent | UI dismiss = UPDATE `dismissed_at` — OK sans DELETE |

### `farm_reports` (00005)

| Mapper | SQL | Écart |
|--------|-----|-------|
| `report-mapper.ts` | colonnes alignées | |
| `payload` complet | `payload_json jsonb` | |
| Pas de UPDATE policy | ✅ | insert + select + delete seulement |
| `created_by` | uuid nullable | Pas d’utilisateur auth UUID aujourd’hui |

### Identifiant ferme

| Actuel | Cible |
|--------|-------|
| `DEFAULT_FARM_ID = "local-farm-v1"` (string) | `uuid` dans table `farms` |
| Variable env proposée | `LANAFARM_FARM_ID=<uuid>` côté serveur |

---

## Décision auth recommandée : **Option C (hybride V1)**

### Pourquoi pas A seul ni B maintenant

| Option | Verdict |
|--------|---------|
| **A** Service role serveur | ✅ Cœur de la reco V1 |
| **B** Supabase Auth + JWT | ✅ Cible V2 — trop de scope pour premier déploiement |
| **C** Hybride | ✅ **Retenu** |

### Option C — détail

1. **Conserver** login `/login` + `middleware.ts` + `AUTH_*` (déjà sur Vercel).
2. **Ne pas** exposer `SUPABASE_SERVICE_ROLE_KEY` au navigateur.
3. Créer **Route Handlers** `/api/farm/*` (ou Server Actions) qui :
   - vérifient le cookie session (`hasValidSession`) ;
   - appellent Supabase avec `createClient(url, SERVICE_ROLE_KEY)` ;
   - filtrent **toujours** par `LANAFARM_FARM_ID` (env).
4. **Réécrire RLS 00004/00005** pour V1 serveur :
   - soit désactiver accès `anon` direct ;
   - soit policies basées sur `service_role` uniquement (pas de client anon en prod V1).
5. **V2** : Supabase Auth, JWT `app_metadata.farm_id`, client `anon` + RLS, retirer service role des chemins user.

### Impact `middleware.ts`

- Inchangé pour les pages UI.
- Les routes `/api/*` doivent aussi vérifier la session (ou être appelées uniquement depuis l’app authentifiée).

---

## Liste migrations à écrire / corriger

### À créer

#### `00001_initial_schema.sql` (L)

- `farms`
- `productions`, `ventes`, `depenses`, `tresorerie`, `transferts_stock`, `action_logs`
- FK `farm_id → farms(id)`
- Index dates + `statut`
- UNIQUE production active / jour (partiel)
- Triggers **optionnels** V1 (validation stock) → app-only recommandé

#### `00002_farm_config.sql` (M)

- `farm_profiles`, `farm_preferences`, `farm_seuils`
- `categories_depense`, `methodes_paiement`
- Seed SQL ou script TS : contenu de `config-defaults.ts`

#### `00003_rls_policies.sql` (M)

- RLS sur **toutes** tables 00001–00002
- Si Option C V1 : documenter que seul le **service role** accède ; policies permissives pour `service_role` ou pas d’accès anon

### À corriger (00004 / 00005)

| Fichier | Correction |
|---------|------------|
| `00004_farm_notifications.sql` | Remplacer `auth.jwt() ->> 'farm_id'` par stratégie C, ou ajouter note + migration `00006_auth_align.sql` |
| `00005_farm_reports.sql` | Idem |
| Les deux | Ajouter policy `UPDATE` si client anon un jour ; `SELECT` requis pour `UPDATE` |

### `00006_seed_farm.sql` (S) — recommandé

- 1 ligne `farms`
- Config + listes
- Option : port du seed mois courant (`seedInitialState`)

---

## Variables d’environnement complètes

### Vercel — déjà utilisées

| Variable | Statut |
|----------|--------|
| `AUTH_EMAIL` | ✅ requis |
| `AUTH_PASSWORD` | ✅ requis |
| `AUTH_SESSION_TOKEN` | ✅ requis |

### Vercel — à ajouter (Supabase)

| Variable | Secret | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | non | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | non | Publishable ; inutilisé en V1 si 100 % serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | **oui** | Jamais `NEXT_PUBLIC_` |
| `LANAFARM_FARM_ID` | oui | UUID de la ferme seed |
| `NEXT_PUBLIC_NOTIFICATIONS_REMOTE` | non | `true` quand repo branché |
| `NEXT_PUBLIC_REPORTS_REMOTE` | non | `true` quand repo branché |

### Fichier local

- Créer `.env.example` à la racine (actuellement **absent** dans le repo) avec toutes les clés ci-dessus sans valeurs.

---

## Plan d’implémentation (15 tâches)

| # | Tâche | Taille | Dépendances |
|---|--------|--------|-------------|
| 1 | Créer projet Supabase + noter URL/keys | S | — |
| 2 | Rédiger `00001_initial_schema.sql` | L | 1 |
| 3 | Rédiger `00002_farm_config.sql` + seed | M | 2 |
| 4 | Rédiger `00003_rls_policies.sql` (stratégie C) | M | 2–3 |
| 5 | Aligner `00004`/`00005` ou `00006` auth | S | 4 |
| 6 | `supabase db push` / appliquer migrations | S | 2–5 |
| 7 | `npm install @supabase/supabase-js` (+ `@supabase/ssr` si besoin) | S | — |
| 8 | `src/lib/supabase/server.ts` + `client.ts` | M | 7 |
| 9 | `supabase gen types` → `types/database.ts` | S | 6–8 |
| 10 | API routes CRUD config + listes | M | 8–9 |
| 11 | API routes production + transferts | L | 8–9 |
| 12 | API routes ventes, dépenses, trésorerie | L | 11 |
| 13 | Hydratation `farm-store` depuis API (remplacer seed) | L | 10–12 |
| 14 | Brancher `supabaseNotificationRepository` + flag remote | M | 8, 13 |
| 15 | Brancher `supabaseReportRepository` + flag remote | M | 8, 13 |

**Estimation globale** : 3–5 jours dev concentré (hors tests terrain).

### Stratégie store : **progressive** (recommandée)

1. Config → Production → Ventes → Dépenses → Trésorerie → Notifications → Rapports  
2. Garder seed en fallback dev si `SUPABASE_URL` absent  
3. Éviter big-bang qui casse tout le terrain

---

## Risques

### P0 (bloquants prod)

| Risque | Mitigation |
|--------|------------|
| RLS JWT sans Supabase Auth | Option C : API serveur + service role + `LANAFARM_FARM_ID` |
| `SERVICE_ROLE` exposée au client | Uniquement dans Route Handlers server-side |
| Migrations 00001–00003 absentes | Ne pas appliquer 00004/00005 seules en prod métier |
| `farm_id` string `"local-farm-v1"` | Migrer vers UUID + env |

### P1 (importants)

| Risque | Mitigation |
|--------|------------|
| Perte données au refresh | Brancher store sur Supabase |
| `montant` vente en DB par erreur | Revue migration + mappers |
| Pas de `.env.example` | Ajouter au repo |
| 8 services vides | Implémenter par module |
| Contrainte 1 prod/jour | Index unique partiel + gestion erreur UI |

### P2 (plus tard)

| Risque | Mitigation |
|--------|------------|
| Realtime notifications | Channel postgres_changes |
| Supabase Auth multi-utilisateur | V2 |
| Pagination grosses tables | Index + limit/offset |
| `action_logs` sans `farm_id` | Migration + type TS |

---

## Checklist pré-prod finale

### Supabase

- [ ] Projet créé (région adaptée)
- [ ] Migrations 00001 → 00006 appliquées sans erreur
- [ ] RLS activé sur toutes tables `public`
- [ ] Advisors Supabase sans alerte critique
- [ ] Seed ferme + config présent
- [ ] Aucune clé `service_role` dans le code client

### Vercel

- [ ] `AUTH_*` configurées
- [ ] `SUPABASE_*` + `LANAFARM_FARM_ID` configurées
- [ ] Redeploy après ajout env
- [ ] Login + dashboard OK

### App

- [ ] Refresh page : données persistent
- [ ] Production / ventes / KPI cohérents (alvéoles entières)
- [ ] Notifications + rapports si flags remote
- [ ] Exports PDF/Excel inchangés (local OK)

### Sécurité

- [ ] `.env` / `.env.local` dans `.gitignore` (déjà via `.env*`)
- [ ] Repo GitHub sans secrets

---

## Fichiers code — état actuel (inventaire)

| Fichier | État |
|---------|------|
| `package.json` | Pas `@supabase/supabase-js` |
| `src/lib/supabase/client.ts` | `export const supabase = null` |
| `src/lib/supabase/server.ts` | ❌ absent |
| `src/services/*.ts` | 6/8 vides (`export {}`) |
| `src/contexts/farm-store.tsx` | ~2300 lignes, seed + reducer, **source vérité** |
| `middleware.ts` | Auth cookie, OK |
| `src/lib/notifications/*` | Mapper OK, repo Supabase = stub |
| `src/lib/reports/*` | Mapper OK, repo Supabase = stub |
| `localStorage` | `lanafarm-notifications-v1`, `lanafarm-reports-v1` |

---

## Contraintes métier — recommandation SQL vs app

| Règle | Recommandation audit |
|-------|---------------------|
| 1 production active / jour | **SQL** : UNIQUE partiel + erreur UI existante |
| `envoyesVente ≤ production` | **App** (`production-calc`) — trigger optionnel |
| Stock vente ≤ dispo | **App** (`sales-calc`) — trop contextuel pour trigger |
| Transfert auto | **App** (`farm-store` reducer) |
| Alvéoles entières | **App** — pas CHECK SQL (capacité variable) |
| KPI | **Jamais en SQL** — `kpi-sources.ts` uniquement |

---

*Rapport généré par audit du repo local LanaFarm — prêt pour phase d’implémentation.*
