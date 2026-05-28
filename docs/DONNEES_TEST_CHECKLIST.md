# Données de test & checklist livraison — LanaFarm

> **Environnement** : local `http://localhost:3000` — `NEXT_PUBLIC_LANAFARM_DATA_REMOTE=false` (ou Supabase si prod).  
> **Calendrier global** : **Personnalisé → 25 mai 2026 → 27 mai 2026** pour les KPI ci-dessous.  
> **Capacité plateau** : **30 œufs/alvéole** (défaut).  
> **Prix casier défaut** : **37 000 GNF**.  
> **Cassés vente** : **masqués** (`SHOW_VENTE_CASSES=false`) — ne pas saisir côté ventes.

---

## Jeu de données principal (3 jours)

### 1. Production

| Date | Ramassées (alv.) | Œufs cassés | Mises en vente (alv.) |
|------|------------------|-------------|------------------------|
| **2026-05-25** (lun) | 40 | 30 | 30 |
| **2026-05-26** (mar) | 36 | 0 | 28 |
| **2026-05-27** (mer) | 42 | 60 | 32 |

**Contrôles** : alvéoles entières ; transfert auto « reçu » si mises en vente > 0 ; pas de colonne « Perdus ».

---

### 2. Ventes (1 vente / jour — jeu de base)

| Date | Vendus (alv.) | Prix casier (GNF) | Client |
|------|---------------|-------------------|--------|
| 2026-05-25 | 25 | 37 000 | Marché A |
| 2026-05-26 | 20 | 38 000 | Boutique B |
| 2026-05-27 | 28 | 37 000 | Marché A |

**Montants par jour** : **925 000** · **760 000** · **1 036 000 GNF**.

**Tableau ventes** : **3 lignes** (1 par date), pas 3+ sous-lignes. Détail via **⋯ → Voir le détail**.

---

### 3. Dépenses (1 dépense / jour — jeu de base)

| Date | Catégorie | Montant (GNF) |
|------|-----------|---------------|
| 2026-05-25 | Alimentation animale | 450 000 |
| 2026-05-26 | Transport | 75 000 |
| 2026-05-27 | Main d'œuvre | 200 000 |

**Tableau dépenses** : **3 lignes** (1 par date). Détail via **⋯**.

---

### 4. Trésorerie

| Date | Reçu (GNF) | Versé (GNF) | Méthode |
|------|------------|-------------|---------|
| 2026-05-25 | 900 000 | 500 000 | Espèces |
| 2026-05-27 | 1 050 000 | 1 050 000 | Orange Money |

---

## KPI attendus (plage 25 → 27 mai 2026)

| KPI | Valeur attendue | Où |
|-----|-----------------|-----|
| Chiffre d'affaires | **2 721 000 GNF** | Dashboard |
| Dépenses | **725 000 GNF** | Dashboard |
| Profit | **1 996 000 GNF** | Dashboard |
| Alvéoles ramassées | **118 alv.** | Production |
| Alvéoles mises en vente | **90 alv.** | Production |
| Œufs cassés (ferme) | **90 œufs** | Production |
| Stock ferme (instantané) | **28 alv.** | Dashboard / Production |
| Stock magasin (instantané) | **17 alv.** | Dashboard / Ventes |
| Montant versé (période) | **1 550 000 GNF** | Trésorerie |
| Reste à verser (cumul) | **1 171 000 GNF** | Dashboard |

### Détail calcul

- **CA** = (25×37k) + (20×38k) + (28×37k) = **2 721 000**
- **Dépenses** = 450k + 75k + 200k = **725 000**
- **Profit** = **1 996 000**
- **Stock ferme** = (40−30)+(36−28)+(42−32) = **28 alv.**
- **Stock magasin** = reçus 90 − vendus 73 = **17 alv.** (cassés vente = 0 en V1)

---

## Jeu complémentaire — plusieurs lignes / même jour

À saisir **en plus** ou sur une ferme vierge (ex. **28 mai 2026**) :

### Ventes du 28/05 (mode 1 jour, 2 lignes)

| Ligne | Vendus (alv.) | Prix (GNF) | Client |
|-------|---------------|------------|--------|
| 1 | 10 | 37 000 | Client A |
| 2 | 5 | 35 000 | Client B |

**Attendu tableau** : **1 ligne** « jeudi 28 mai » · montant **545 000 GNF** (370k+175k).  
**⋯ → détail** : 2 items avec actions séparées.

### Dépenses du 28/05 (2 lignes)

| Ligne | Catégorie | Montant (GNF) |
|-------|-----------|---------------|
| 1 | Transport | 50 000 |
| 2 | Emballage / Plateaux | 30 000 |

**Attendu tableau** : **1 ligne** · **80 000 GNF** · catégories résumées.

### Plusieurs jours (28–29 mai)

- Mode **Plusieurs jours** : période Du/Au, toggle à droite du calendrier (pas collé au titre).
- **Ventes** : chaque jour = bloc avec bouton **+ Ligne** (comme dépenses).
- Enregistrer → conflit si jour déjà saisi → dialog remplacement.

---

## Checklist globale avant livraison

### Calendrier & KPI
- [ ] Presets **Cette semaine**, **Ce mois-ci**, **Personnalisé** (Du/Au) filtrent toutes les pages
- [ ] Personnalisé **25–27 mai** → KPI du tableau ci-dessus
- [ ] F5 : données persistées (local ou Supabase selon `.env.local`)

### Dialogues de saisie (Production / Ventes / Dépenses)
- [ ] Toggle **Plusieurs jours** / **1 jour** à **droite du calendrier**, pas au titre
- [ ] Modale compacte, sans bande vide à droite
- [ ] Preview fixe en bas (stock / CA / total)
- [ ] **Ventes & dépenses 1 jour** : plusieurs lignes (+ Ajouter)
- [ ] **Ventes multi-jours** : plusieurs lignes **par jour**
- [ ] Menus **catégorie** et **prix** visibles (popover, pas coupés)
- [ ] Pas de cassés vente à l'écran
- [ ] Prix : **1 champ** + suggestions au focus (pas de pastilles)

### Tableaux Ventes & Dépenses (nouveau)
- [ ] **1 seule ligne par date** (plus de sous-lignes `·`)
- [ ] Menu **⋯** : résumé + **Voir le détail**
- [ ] Détail : liste des entrées + modifier / annuler / historique par ligne
- [ ] Jour mixte (1 active + 1 annulée) → badge **Partiel**
- [ ] Recherche, tri, pagination au **niveau jour**
- [ ] 1 seule entrée le jour → raccourcis Modifier/Annuler dans le ⋯ aussi

### Production
- [ ] Ajout, modification, multi-jours, conflit même jour
- [ ] Champs numériques compacts

### Dépenses & Trésorerie
- [ ] Totaux cohérents avec dashboard
- [ ] Catégories combobox + création

### Dépôts / transferts
- [ ] Reçus auto après production (mises en vente > 0)

### Historique (`/historique`)
- [ ] Journal : 1 ligne résumée par enregistrement batch
- [ ] Filtres module / type / recherche

### Rapports
- [ ] Rapport période personnalisée
- [ ] PDF / Excel sans colonne Perdus / cassés vente
- [ ] Logo présent

### Mobile
- [ ] Dialogues sans scroll horizontal parasite
- [ ] Champs date compacts
- [ ] Menu : déconnexion visible
- [ ] ⋯ et dialog détail utilisables au pouce

### Production Vercel + Supabase
- [ ] `NEXT_PUBLIC_LANAFARM_DATA_REMOTE=true`
- [ ] Auth papa OK
- [ ] Saisie visible dans Supabase (`ventes`, `depenses`, …)
- [ ] **Aucune migration** requise pour agrégation tableaux (UI seule)

---

## Ordre de saisie recommandé

1. Production (25, 26, 27 mai)  
2. Ventes (25, 26, 27 mai)  
3. Dépenses (25, 26, 27 mai)  
4. Trésorerie (25, 27 mai)  
5. Calendrier → Personnalisé 25–27 mai → **contrôler dashboard**  
6. Optionnel : 28 mai multi-lignes → tableaux 1 ligne/date  
7. Rapports + exports  
8. Mobile + prod Supabase  

---

## Résultat build (CI local)

```bash
npm run build   # doit passer sans erreur TypeScript
```

Dernière vérification agent : **OK** (Next.js 16.2.6).
