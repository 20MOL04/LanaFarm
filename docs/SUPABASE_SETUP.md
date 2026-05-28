# Mise en place Supabase — LanaFarm (pour papa)

## Projet Supabase connecté (28 mai 2026)

| Champ | Valeur |
|-------|--------|
| Nom | **LanaFarm** |
| Project ref | `pcspcipylapakchghwvp` |
| URL | `https://pcspcipylapakchghwvp.supabase.co` |
| Région | `eu-west-1` |
| Migrations | **7/7 appliquées** via MCP |
| Ferme seed | `f47ac10b-58cc-4372-a567-0e02b2c3d479` |

Dashboard : [https://supabase.com/dashboard/project/pcspcipylapakchghwvp](https://supabase.com/dashboard/project/pcspcipylapakchghwvp)

## Ce qui est déjà dans le code

- Migrations SQL `supabase/migrations/00001` → `00007`
- API serveur `/api/farm/state`, `/api/farm/notifications`, `/api/farm/reports`
- Mode prod : `NEXT_PUBLIC_LANAFARM_DATA_REMOTE=true` → **aucune donnée métier en localStorage**

## Ce que tu dois faire (15 min)

### 1. Créer le projet Supabase

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → nom `LanaFarm`, région proche (ex. `eu-west-1`)
3. Note le mot de passe base de données

### 2. Migrations SQL

**Déjà fait** sur le projet `LanaFarm` (`pcspcipylapakchghwvp`) : `00001` → `00007`.

Pour un autre projet, SQL Editor ou CLI :

**Option A — SQL Editor**

Exécuter chaque fichier dans `supabase/migrations/` dans l’ordre.

**Option B — CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
supabase db push
```

### 3. Récupérer les clés API

Dashboard → **Project Settings** → **API** :

| Clé | Variable |
|-----|----------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ **Ne jamais** mettre `service_role` dans une variable `NEXT_PUBLIC_*`.

### 4. Variables Vercel (production papa)

Dans le projet Vercel → **Settings** → **Environment Variables** :

```
AUTH_EMAIL=...
AUTH_PASSWORD=...
AUTH_SESSION_TOKEN=...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

LANAFARM_FARM_ID=f47ac10b-58cc-4372-a567-0e02b2c3d479
NEXT_PUBLIC_LANAFARM_FARM_ID=f47ac10b-58cc-4372-a567-0e02b2c3d479
NEXT_PUBLIC_LANAFARM_DATA_REMOTE=true
```

Puis **Redeploy**.

### 5. Local (ton PC pour tester)

Copie `.env.example` → `.env.local`, remplis les mêmes clés, mets `NEXT_PUBLIC_LANAFARM_DATA_REMOTE=true` pour tester comme papa.

## Vérification

1. Login sur l’app
2. Créer une production → refresh F5 → la ligne est toujours là
3. Dashboard Supabase → **Table Editor** → `productions` : une ligne apparaît

## UUID ferme

Le seed crée la ferme :

`f47ac10b-58cc-4372-a567-0e02b2c3d479`

Garde **exactement** cette valeur dans `LANAFARM_FARM_ID` et `NEXT_PUBLIC_LANAFARM_FARM_ID` sauf si tu recrées un seed différent.

## Dev sans Supabase

`NEXT_PUBLIC_LANAFARM_DATA_REMOTE=false` → seed + localStorage (pour toi uniquement, pas pour papa).
