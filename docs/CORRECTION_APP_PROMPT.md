# Prompt agent — correction totale dialogues LanaFarm (pré-livraison)

> **Usage** : coller ce prompt tel quel à l’agent. Ne coder qu’après validation explicite du product owner (« go », « corrige tout », etc.).

---

## Rôle

Tu es un ingénieur front senior + designer UX terrain. Tu livres une app de gestion fermière (Next.js 16, React 19, Tailwind, Supabase) utilisée **sur mobile et PC** par un opérateur qui saisit vite, sans lire de pavés. Le niveau attendu n’est pas « ça marche » : c’est **extraordinaire** — compact, cohérent, zéro vide inutile, zéro duplication.

---

## Interdictions absolues

1. **Aucune duplication** de layout, styles, ou logique entre production / ventes / dépenses. Un seul système partagé pour :
   - en-tête dialogue (titre + toggle mode),
   - squelette dialogue (header → scroll → preview fixe → footer),
   - gabarits champs compacts (date, nombre, prix GNF, texte optionnel),
   - tableaux multi-jours (colonnes, inputs, wrap),
   - panneaux preview (`preview-panel.tsx` et dérivés uniquement),
   - largeur modale « fit-content » (pas de bande vide à droite).
2. **Pas de pastilles, pas de 2ᵉ champ prix**, pas de texte pédagogique (« Jusqu’à aujourd’hui… », « Calendrier global… »).
3. **Pas de MAJUSCULES** dans les libellés UI (sauf **GNF** et acronymes métier).
4. **Pas de `w-full` / `max-w-lg` par défaut** sur une modale dont le contenu est étroit — la coquille **épouse** le contenu.
5. **Ne pas toucher** Supabase, auth, seed, calendrier global (presets), pages listes desktop — sauf masquage cassés vente déjà validé.

---

## Problèmes constatés (à corriger tous)

### A. Modale plus large que le contenu
Sur multi-jours, le tableau est compact à gauche et **~30 % de vide à droite**. Cause : `DialogContent` avec `w-[min(100vw-1rem,100%)]` sur élément `fixed` → quasi pleine largeur viewport. Le contenu interne en `w-max` flotte dans une boîte immense.

**Attendu** : largeur modale = `max(largeur période, largeur tableau, largeur preview)` + padding, plafonnée à `min(100vw - 1rem, …)`. **Aucune bande vide** visible sur PC ni mobile.

### B. Mode 1 jour — champs trop larges pour rien
Qté, prix, montant, catégorie, client : inputs **étirés sur toute la modale** alors qu’ils contiennent 1–5 chiffres. Cartes (`SaleLineCard`, `ExpenseLineCard`, champs production) en grille 2 colonnes pleine largeur = gaspillage.

**Attendu** : gabarit « saisie terrain » — champs numériques ~5–6 caractères, prix GNF ~7 caractères, texte optionnel limité (`max-w` explicite). Modale 1 jour **plus étroite** (`fit-content` ou `max-w-md` max).

### C. Ventes 1 jour — plusieurs lignes le même jour
Les **dépenses** permettent plusieurs lignes par jour (+ Ajouter). Les **ventes** doivent pareil : **plusieurs ventes sur un seul jour** (plusieurs clients / prix / quantités), avec bouton Ajouter, suppression de ligne, validation cumulée, preview qui agrège le jour. Ce n’est pas optionnel — c’est le parité métier avec dépenses.

Vérifier que l’enregistrement, le preview (`computeSalesPreview`), et l’édition supportent **N lignes / 1 jour** de bout en bout. Si l’UI existe mais est mal présentée (cartes énormes), refaire le layout sans casser la logique store.

### D. En-tête dialogue — toggle mode
Le bouton **« Plusieurs jours » / « 1 jour »** doit être :
- **toujours à droite**,
- **collé au titre** (même ligne, petit gap ~8px),
- **avant** le bouton fermer (X) — pas flottant au milieu, pas sous le titre.
- Composant unique `DialogFormHeader` (ou équivalent) utilisé par production, ventes, dépenses — **zéro copie** du markup header dans chaque dialogue.

### E. Multi-jours — tableaux
- En-têtes **sur une seule ligne** (`whitespace-nowrap`), largeur colonne = **au moins** la largeur du libellé.
- Inputs numériques : proportionnés (pas minuscules, pas lost in cellule) — largeur ~ contenu attendu, pas `max-w-lg` parent.
- Scroll vertical **uniquement** si lignes dépassent la zone visible — pas de `flex-1` qui force une scrollbar sur 4 lignes.
- Ventes : colonne **Client (optionnel)**. Dépenses : **Description (optionnel)**.
- Preview **même largeur utile** que le tableau (bords alignés).

### F. Preview
- Toujours **visible en bas**, hors zone scroll.
- Style **unique** via `preview-panel.tsx` (shell + grid + cell) — production, ventes, dépenses = même densité, pas de panneau « agressif » ou surdimensionné.
- Libellés preview en casse phrase, une ligne si possible.

### G. Cassés vente (V1)
Masqués partout UI. `SHOW_VENTE_CASSES = false`, enregistrement `cassesVente = 0`. Production seule garde cassés.

### H. Prix ventes
Un champ, menu suggestions au focus, saisie libre. Pas de pastilles.

---

## Architecture cible (factorisation obligatoire)

```
src/components/shared/
  dialog-form-shell.tsx      # DialogContent fit + Header + Body + PreviewBar + Footer
  dialog-form-header.tsx     # Titre + MultiDayModeToggle alignés
  form-field-compact.tsx     # ou tokens dans multi-day-table-styles / form-compact
  multi-day-period-picker.tsx
  multi-day-table-styles.ts  # seule source largeurs colonnes + classes inputs
  preview-panel.tsx          # PreviewPanelShell, PreviewGrid, PreviewCell
  production-preview-panel.tsx  # thin wrappers, pas de styles locaux
  stock-preview-panel.tsx
  expense-preview-panel.tsx

src/components/ui/dialog.tsx   # base Radix ; pas de logique métier
```

Chaque dialogue métier (`add-*-dialog.tsx`) = **orchestration + validation + store** uniquement. Pas de CSS layout dupliqué.

---

## Gabarits dimensions (indicatif — ajuster au pixel près)

| Élément | Largeur cible |
|--------|----------------|
| Date (1 champ) | ~10.5rem max |
| Nombre (alv., œufs) | ~4.5–5.5rem |
| Prix / montant GNF | ~6–7rem |
| Client / description optionnel | ~8–10rem max |
| Modale 1 jour | fit-content, plafond ~22–26rem si contenu le permet |
| Modale multi-jours | fit-content = largeur tableau + padding |

Mesurer sur **le libellé le plus long** de chaque colonne, pas sur le minimum arbitraire.

---

## Structure dialogue (tous modules)

```
DialogFormShell (largeur = contenu)
  DialogFormHeader
    [Titre]  [gap serré]  [Toggle 1j / Plusieurs jours]     … espace flex …    [X Radix]
  DialogBody
    [Date ou Période Du/Au — compact]
    DialogScrollRegion (overflow seulement si nécessaire)
      [Cartes lignes 1j OU tableau multi-jours]
    StoreErrorBanner
  DialogPreviewBar (shrink-0, pleine largeur utile du shell)
    [PreviewPanel unifié]
  DialogFooter
    Annuler | Enregistrer
```

---

## Critères d’acceptation (binaires)

- [ ] **Zéro bande vide** à droite du tableau ou des champs sur captures PC (production, ventes, dépenses — 1j et multi).
- [ ] Toggle **1 jour / Plusieurs jours** collé au titre, à droite du titre, sur les 3 dialogues — composant unique.
- [ ] Mode 1 jour : champs numériques **non étirés** ; modale visiblement plus étroite qu’aujourd’hui.
- [ ] **Ventes 1 jour** : plusieurs lignes de vente même jour, UX équivalente dépenses (+ Ajouter, supprimer, preview total jour).
- [ ] Multi-jours : en-têtes tableau **1 ligne**, scroll vertical **seulement** si > ~6 lignes visibles.
- [ ] Preview toujours visible sans scroller la modale entière.
- [ ] Aucun fichier dialogue ne redéfinit les classes layout déjà dans `shared/`.
- [ ] `npm run build` OK.
- [ ] Cassés vente invisibles ; prix = 1 champ + popover.

---

## Méthode de travail

1. Lire `node_modules/next/dist/docs/` si API Next.js incertaine.
2. Implémenter d’abord le **shell partagé** + header + tokens dimensions.
3. Migrer **production**, puis **ventes**, puis **dépenses** — un module à la fois, build entre chaque.
4. Tester visuellement 1j et multi sur les 3 modules.
5. Ne pas commit / push sauf demande explicite.

---

## Fichiers probables touchés

- `src/components/ui/dialog.tsx`
- `src/components/shared/dialog-form-shell.tsx` (nouveau)
- `src/components/shared/dialog-form-header.tsx` (nouveau)
- `src/components/shared/multi-day-table-styles.ts`
- `src/components/shared/multi-day-mode-toggle.tsx`
- `src/components/shared/preview-panel.tsx` + panneaux métier
- `src/components/production/add-production-dialog.tsx`
- `src/components/sales/add-sale-dialog.tsx` + `sales-multi-day-form.tsx`
- `src/components/expenses/add-expense-dialog.tsx` + `expenses-multi-day-form.tsx`
- `src/lib/sales-preview.ts`, `src/lib/sales-calc.ts` (si agrégation multi-lignes 1j)

---

## Definition of done

L’utilisateur ouvre « Ventes du jour » en 1 jour, ajoute 3 lignes (clients différents), voit un preview compact en bas, enregistre. Passe en « Plusieurs jours », la modale **rétrécit ou grandit exactement** autour du tableau sans vide à droite. Même ressenti sur production et dépenses. **Un seul langage visuel**, aucune régression mobile.

Quand le PO dit **« go »**, exécuter ce prompt intégralement sans raccourci.
