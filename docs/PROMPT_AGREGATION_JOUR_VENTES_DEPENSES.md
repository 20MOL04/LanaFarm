# Prompt agent — agrégation par jour (tableaux Ventes & Dépenses)

> **Usage** : coller ce prompt tel quel à l’agent. **Ne coder qu’après validation explicite** du product owner (« go », « implémente », etc.).

---

## Rôle

Tu es un ingénieur full-stack senior (Next.js 16, React 19, Tailwind, Supabase) et designer UX terrain. Tu ajoutes une **nouvelle fonctionnalité d’affichage** dans LanaFarm : les tableaux **Ventes** et **Dépenses** doivent montrer **une seule ligne par date**, avec le **détail accessible via le menu ⋯ (trois points)**.

Le niveau attendu : cohérent avec le reste de l’app, compact, mobile-first, **zéro duplication** entre ventes et dépenses.

---

## Contexte produit

### Comportement actuel (à remplacer)

Quand plusieurs ventes ou dépenses existent le **même jour**, le tableau affiche un **mix résumé + lignes détaillées** :
- 1ʳᵉ ligne du jour = totaux (montant, qté, catégories…)
- lignes suivantes = `·` + détail ligne par ligne + actions ⋯ par ligne

L’utilisateur trouve ça confus et veut **une seule ligne par date**.

### Comportement cible

| Zone | Attendu |
|------|---------|
| **Tableau Ventes** (`/ventes`) | **1 ligne = 1 jour** (agrégation des ventes actives du jour) |
| **Tableau Dépenses** (`/depenses`) | **1 ligne = 1 jour** (agrégation des dépenses actives du jour) |
| **Menu ⋯** | Résumé du jour + accès au **détail** (liste des lignes) + actions par ligne |
| **Persistance** | **Inchangée** — toujours 1 enregistrement DB par vente / par dépense |
| **Page Historique** (`/historique`) | **Hors scope** — journal d’actions déjà résumé par batch |

---

## Interdictions

1. **Pas de migration Supabase obligatoire** pour livrer cette feature (voir section Supabase).
2. **Pas de duplication** de logique d’agrégation entre `sales-table.tsx` et `expenses-table.tsx` — extraire un module partagé.
3. **Ne pas casser** : saisie multi-lignes (dialogues), KPIs, rapports, dashboard, sync farm-state ↔ Supabase.
4. **Pas de MAJUSCULES** inutiles dans l’UI (sauf **GNF**).
5. **Ne pas toucher** production / trésorerie / historique journal sauf réutilisation de composants partagés.
6. **Ne pas commit / push** sauf demande explicite.

---

## Modèle de données (existant — ne pas changer)

### Supabase / domaine

Chaque ligne métier reste une **entrée indépendante** :

```sql
-- supabase/migrations/00001_initial_schema.sql (extrait — DÉJÀ EN PLACE)

create table public.ventes (
  id uuid primary key,
  farm_id uuid not null,
  jour_iso timestamptz not null,
  vendus integer not null,
  casses_vente integer not null default 0,
  prix bigint not null,
  client text,
  statut text check (statut in ('actif', 'annule', 'archive')),
  lineage_id uuid,
  ...
);

create table public.depenses (
  id uuid primary key,
  farm_id uuid not null,
  jour_iso timestamptz not null,
  categorie text not null,
  montant bigint not null,
  description text,
  statut text check (statut in ('actif', 'annule', 'archive')),
  lineage_id uuid,
  ...
);
```

Store front : `vente/addDay`, `depense/addDay` créent **N entrées** pour N lignes.  
Sync : `src/lib/supabase/farm-state.ts` — `select` / `insert` ligne par ligne.

**→ L’agrégation par jour est une couche UI + helpers TS, pas une nouvelle table.**

---

## Section Supabase — quoi faire / ne pas faire

### ✅ À faire (agent)

| Action | Détail |
|--------|--------|
| **Aucune migration SQL** | Schéma actuel compatible (plusieurs lignes / `jour_iso` / `farm_id`). |
| **Aucun changement RLS** | Policies existantes (`00003_rls_policies.sql`) suffisent. |
| **Aucun changement API** | `/api/farm/state` continue de renvoyer tableaux plats `ventes[]`, `depenses[]`. |
| **Vérifier sync** | Après implémentation UI, confirmer qu’ajout / annulation / restauration d’une ligne individuelle se reflète toujours en Supabase via le flux existant. |

### ❌ Ne pas faire (sauf demande produit future)

- Table `ventes_jour` / `depenses_jour` (agrégats matérialisés)
- Colonne `day_group_id` sur ventes/dépenses
- Vue matérialisée Postgres pour le tableau
- Edge Function de regroupement

### Si l’agent hésite

> **Règle** : tant que le tableau lit `state.ventes` / `state.depenses` et groupe côté client par `startOfDay(jourISO)`, **Supabase n’a rien à exécuter**.

### Commandes Supabase (référence — exécution NON requise)

```bash
# Uniquement pour vérifier l’état local après dev — PAS de nouvelle migration
npx supabase db diff          # doit rester vide si aucun changement schéma
npx supabase migration list   # confirmer qu’aucune 00008+ n’a été ajoutée
```

---

## Architecture cible

```
src/lib/
  day-entry-grouping.ts          # NOUVEAU — clé jour, agrégats ventes/dépenses, statut mixte

src/components/shared/
  day-group-detail-dialog.tsx    # NOUVEAU — détail d’un jour (liste lignes + actions)
  day-group-row-actions.tsx      # NOUVEAU — menu ⋯ ligne agrégée (ouvre détail + raccourcis)

src/components/sales/
  sales-table.tsx                # REFACTOR — consomme DayGroup, 1 row/jour

src/components/expenses/
  expenses-table.tsx             # REFACTOR — idem

src/lib/history-entry-display.ts # Inchangé — historique versioning par entrée
src/components/sales/sales-row-actions.tsx      # Réutilisé DANS le détail
src/components/expenses/expenses-row-actions.tsx
```

### Helper partagé `day-entry-grouping.ts`

Types proposés :

```ts
type DayGroupBase = {
  jourISO: string;           // clé normalisée startOfDay
  dayKey: string;            // ISO startOfDay pour Map
  entryIds: string[];        // ids des entrées du groupe (filtrées selon vue)
  count: number;             // nb entrées dans le groupe affiché
  countActif: number;
  countAnnule: number;
  statut: EntreeStatut | "mixte";  // règle ci-dessous
};

type SalesDayGroup = DayGroupBase & {
  kind: "vente";
  totalMontant: number;
  totalAlveoles: number;
  totalCassesOeufs: number;
  clients: string[];
  prixMin: number;
  prixMax: number;
  entries: SaleRowView[];    // ou Vente[] + vues calculées
  recuFermeJour: number;     // métier jour (transferts)
  resteVenteJour: number;    // après TOUTES ventes actives du jour
};

type ExpenseDayGroup = DayGroupBase & {
  kind: "depense";
  totalMontant: number;
  categories: string[];      // libellés résolus
  entries: Depense[];
};

function groupSalesByDay(rows: SaleRowView[]): SalesDayGroup[]
function groupExpensesByDay(rows: Depense[], config): ExpenseDayGroup[]
```

**Règle statut agrégé** :
- Toutes `actif` → badge **Actif**
- Toutes `annule` → badge **Annulé**
- Toutes `archive` → badge **Archivé**
- Mélange → badge **Partiel** (tone warning) + tooltip « X actives, Y annulées »

**Filtre statut tableau** : une ligne jour est **visible** si **au moins une** entrée du jour correspond au filtre (ex. filtre « Actives » → jour avec 1 active + 2 annulées reste visible).

---

## Spécification UI — ligne agrégée

### Tableau Ventes — colonnes (1 ligne / jour)

| Colonne | Contenu agrégé |
|---------|----------------|
| **Jour** | `formatDay` + sous-texte si `count > 1` : « 3 ventes » ou clients résumés (max 2 + « +N ») |
| **Reçu** | Reçu ferme du jour (alvéoles) — identique pour toutes les lignes du jour |
| **Vendu** | Σ alvéoles vendues (**entrées actives** du filtre courant) |
| **Cassés** | Masqué si `SHOW_VENTE_CASSES = false` ; sinon Σ cassés jour (1ʳᵉ ligne storage) |
| **Reste** | Reste vente **après toutes les ventes actives du jour** |
| **Prix/casier** | Si 1 prix unique → afficher ; si plusieurs → « Mixte » ou « 35k – 37k » (compact) |
| **Montant** | Σ montant lignes actives |
| **Statut** | Statut agrégé (voir règle) |
| **⋯** | Menu jour (voir ci-dessous) |

**Cas 1 seule vente le jour** : même rendu (pas de sous-lignes), menu ⋯ avec 1 entrée dans le détail.

### Tableau Dépenses — colonnes (1 ligne / jour)

| Colonne | Contenu agrégé |
|---------|----------------|
| **Jour** | `formatDay` + « N dépenses » si N > 1 |
| **Catégorie** | Résumé catégories (`formatCategoriesSummary` existant) |
| **Montant** | Σ montants actifs |
| **Description** | « — » si plusieurs ; sinon description unique |
| **Statut** | Statut agrégé |
| **⋯** | Menu jour |

---

## Spécification UI — menu ⋯ (trois points)

Composant partagé `DayGroupRowActions` :

### Structure du menu Popover

```
┌─────────────────────────────┐
│ Jeudi 28 mai                │  ← MenuLabel
│ 3 ventes · 555 000 GNF      │  ← résumé 1 ligne (MenuLabel muted)
├─────────────────────────────┤
│ 📋 Voir le détail             │  → ouvre DayGroupDetailDialog
├─────────────────────────────┤
│ (si 1 seule entrée active)    │
│   ✏️ Modifier                 │
│   🚫 Annuler                  │
│   🕐 Historique               │
└─────────────────────────────┘
```

### Dialog `DayGroupDetailDialog`

- Titre : « Ventes du 28 mai » / « Dépenses du 28 mai »
- Sous-titre : totaux jour (CA / montant total, nb lignes)
- **Liste compacte** des entrées du jour :

**Ventes (chaque item)** :
- Qté alv. · prix GNF/alv. · client (ou « — ») · montant · badge statut
- Actions inline ou ⋯ par item : Modifier, Annuler/Restaurer, Historique (réutiliser `SalesRowActions` / `ExpensesRowActions`)

**Dépenses (chaque item)** :
- Catégorie · montant · description tronquée · badge statut
- Mêmes actions via `ExpensesRowActions`

- Fermer = bouton ou X
- **Pas de scroll horizontal** ; largeur `max-w-md` / fit mobile

---

## Recherche, tri, pagination

| Fonction | Règle |
|----------|-------|
| **Tri** | Sur les **groupes jour** (date, montant total, etc.) |
| **Recherche** | Match si **une entrée** du jour matche (client, catégorie, montant, date…) — le jour entier apparaît |
| **Pagination** | Compte = **nombre de jours**, pas nombre d’entrées |
| **Filtre catégorie** (dépenses) | Jour visible si ≥1 dépense de la catégorie |
| **Filtre statut** | Jour visible si ≥1 entrée du statut |
| **Deep link** `?jour=…` | Scroll / surligne le jour ; ouvre optionnellement le détail si une seule entrée |

Implémentation recommandée :
1. Filtrer entrées brutes (comme aujourd’hui)
2. Grouper par jour
3. Passer les **groupes** à `useDataTableState` (générique ou adaptateur)

---

## Édition depuis le détail

- **Modifier** une vente/dépense → ouvre le dialogue existant (`AddSaleDialog` / `AddExpenseDialog`) en mode **edit** sur **l’entrée ciblée** (comportement actuel `onRequestEdit(entry)`).
- **Ne pas** ouvrir le dialogue multi-lignes « jour entier » en V1 sauf demande produit.
- Annuler / restaurer / historique versioning → **par entrée** (store inchangé).

---

## Fichiers existants à réutiliser

| Fichier | Usage |
|---------|-------|
| `buildSaleDayMeta` / `buildExpenseDayMeta` | Base agrégation — **factoriser** vers `day-entry-grouping.ts` puis supprimer duplication |
| `isFirstRowOfDay`, lignes `·` | **Supprimer** après migration |
| `EntryRowActions`, `Menu`, `HistoryDialog` | Réutiliser dans le détail |
| `formatDay`, `formatGNF`, `formatNumber` | Affichage |
| `SHOW_VENTE_CASSES` | Respecter masquage cassés vente |

---

## Hors scope (V1)

- Regroupement production / trésorerie
- Modification « tout le jour en bloc » (remplacer toutes les lignes d’un coup)
- Export CSV par jour agrégé
- Page `/historique` (journal actions)
- Rapports opérationnels (KPIs période restent globaux)
- Nouvelle table Supabase

---

## Critères d’acceptation (binaires)

- [ ] Tableau **Ventes** : **exactement 1 ligne par date** (plus de sous-lignes `·`).
- [ ] Tableau **Dépenses** : idem.
- [ ] Menu **⋯** sur chaque ligne jour : résumé + « Voir le détail ».
- [ ] Dialog détail : liste **toutes** les entrées du jour avec actions individuelles.
- [ ] Jour avec **1 seule** entrée : 1 ligne tableau + détail avec 1 item (pas de régression UX).
- [ ] Jour **mixte** actif/annulé : badge « Partiel » + détail correct.
- [ ] Recherche / filtres / pagination fonctionnent au **niveau jour**.
- [ ] KPIs ventes/dépenses **inchangés** (toujours basés sur entrées actives).
- [ ] Sync Supabase **sans migration** — insert/update/delete par entrée OK.
- [ ] Helper agrégation **unique** (`day-entry-grouping.ts`), pas de copier-coller ventes/dépenses.
- [ ] `npm run build` OK.
- [ ] Français, casse phrase, pas de MAJUSCULES décoratives.

---

## Méthode de travail

1. Lire `AGENTS.md` et `node_modules/next/dist/docs/` si API Next incertaine.
2. Créer `day-entry-grouping.ts` + tests manuels sur cas : 0, 1, N lignes/jour, statuts mixtes.
3. Créer `DayGroupDetailDialog` + `DayGroupRowActions` (shared).
4. Refactor `expenses-table.tsx` (plus simple), puis `sales-table.tsx`.
5. Vérifier mobile (menu ⋯, dialog détail).
6. Build + smoke test : ajouter 2 ventes même jour → 1 ligne tableau → détail → modifier 1 ligne.
7. Confirmer **aucun fichier** dans `supabase/migrations/` ajouté.

---

## Cas de test manuels

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | 2 ventes actives le 28/05 | 1 ligne, montant = somme, détail = 2 items |
| 2 | 1 vente active + 1 annulée même jour, filtre Actives | 1 ligne (montant = active seulement), détail filtré ou tout affiché avec badges |
| 3 | Recherche client « Amadou » | Jour visible si un client matche |
| 4 | Tri montant desc | Jours ordonnés par total jour |
| 5 | 3 dépenses catégories différentes | 1 ligne, catégories résumées, détail liste 3 |
| 6 | Annuler une ligne depuis détail | Ligne disparaît ou statut mis à jour ; tableau jour recalculé |
| 7 | Refresh / sync Supabase | Données identiques (N rows DB, 1 row UI/jour) |

---

## Fichiers probables touchés

- `src/lib/day-entry-grouping.ts` *(nouveau)*
- `src/components/shared/day-group-detail-dialog.tsx` *(nouveau)*
- `src/components/shared/day-group-row-actions.tsx` *(nouveau)*
- `src/components/sales/sales-table.tsx`
- `src/components/expenses/expenses-table.tsx`
- `src/components/sales/sales-module.tsx` *(si props edit)*
- `src/components/expenses/expenses-module.tsx` *(si props edit)*

**Ne pas modifier** (sauf bug bloquant découvert) :
- `supabase/migrations/*`
- `src/contexts/farm-store.tsx` (reducers vente/depense)
- `src/lib/supabase/farm-state.ts`
- Dialogues de saisie `add-*-dialog.tsx`

---

## Message de clôture attendu (agent)

À la fin, l’agent doit indiquer :
1. Confirmation **0 migration Supabase**
2. Capture ou description du flux : tableau 1 ligne → ⋯ → détail → action
3. Liste des edge cases statut mixte gérés
4. Résultat `npm run build`
