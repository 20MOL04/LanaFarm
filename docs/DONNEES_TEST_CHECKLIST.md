# Données de test manuelles — LanaFarm

> Saisir ces valeurs en **local** (`NEXT_PUBLIC_LANAFARM_DATA_REMOTE=false`).  
> Calendrier global : **Personnalisé → 25 mai 2026 → 27 mai 2026** pour voir les KPI de la période test.  
> **Capacité plateau** : 30 œufs/alvéole (défaut).  
> **Œufs perdus** : fonction supprimée — ne plus saisir.

---

## 1. Production

| Date | Ramassées (alv.) | Œufs cassés | Mises en vente (alv.) |
|------|------------------|-------------|------------------------|
| **2026-05-25** (lun) | 40 | 30 | 30 |
| **2026-05-26** (mar) | 36 | 0 | 28 |
| **2026-05-27** (mer) | 42 | 60 | 32 |

**À vérifier** : alvéoles entières ; transfert auto « reçu » si mises en vente > 0 ; pas de colonne « Perdus ».

---

## 2. Ventes (après production)

| Date | Vendus (alv.) | Cassés vente (alv.) | Prix casier (GNF) | Client (opt.) |
|------|---------------|---------------------|-------------------|---------------|
| 2026-05-25 | 25 | 0 | 37 000 | Marché A |
| 2026-05-26 | 20 | 1 | 38 000 | Boutique B |
| 2026-05-27 | 28 | 0 | 37 000 | Marché A |

**Montants attendus par jour** : 925 000 · 760 000 · 1 036 000 GNF.

---

## 3. Dépenses

| Date | Catégorie | Montant (GNF) |
|------|-----------|---------------|
| 2026-05-25 | Alimentation animale | 450 000 |
| 2026-05-26 | Transport | 75 000 |
| 2026-05-27 | Main d'œuvre | 200 000 |

---

## 4. Trésorerie

| Date | Reçu (GNF) | Versé (GNF) | Méthode |
|------|------------|-------------|---------|
| 2026-05-25 | 900 000 | 500 000 | Espèces |
| 2026-05-27 | 1 050 000 | 1 050 000 | Orange Money |

---

## KPI attendus (plage 25 → 27 mai 2026)

| KPI | Valeur attendue | Où le voir |
|-----|-----------------|------------|
| Chiffre d'affaires | **2 721 000 GNF** | Dashboard |
| Dépenses | **725 000 GNF** | Dashboard |
| Profit | **1 996 000 GNF** | Dashboard |
| Alvéoles ramassées | **118 alv.** | Production |
| Alvéoles mises en vente | **90 alv.** | Production |
| Œufs cassés (ferme) | **90 œufs** | Production |
| Stock ferme (instantané) | **28 alv.** | Dashboard / Production |
| Stock magasin (instantané) | **16 alv.** | Dashboard / Ventes |
| Montant versé (période) | **1 550 000 GNF** | Trésorerie |
| Reste à verser (cumul) | **1 171 000 GNF** | Dashboard (CA cumul − versé) |

### Détail calcul (contrôle)

- **CA** = (25×37k) + (20×38k) + (28×37k) = **2 721 000**
- **Dépenses** = 450k + 75k + 200k = **725 000**
- **Profit** = CA − dépenses = **1 996 000**
- **Stock ferme** = Σ(ramassé − envoyé vente) = (40−30)+(36−28)+(42−32) = **28 alv.**
- **Stock magasin** = Σ reçus magasin − vendus − cassés vente = 90 − 73 − 1 = **16 alv.** (cassés vente = 1 alv. le 26)

---

## Checklist avant livraison à papa

### Données & calculs
- [ ] Calendrier : **Cette semaine**, **Ce mois-ci**, **Personnalisé** (Du/Au) filtrent bien toutes les pages
- [ ] Personnalisé 25–27 mai affiche les KPI du tableau ci-dessus
- [ ] Aucune trace « œufs perdus » / colonne Perdus
- [ ] F5 : données toujours là (local ou Supabase selon env)

### Modules
- [ ] Production : ajout, modification, multi-jours, conflit même jour
- [ ] Ventes : prix pastilles + « Autre prix » (un seul champ, clavier)
- [ ] Dépenses & Trésorerie : totaux cohérents
- [ ] Dépôts / transferts : reçus auto après production

### Rapports
- [ ] Rapport période personnalisée
- [ ] PDF / Excel sans colonne Perdus
- [ ] Logo présent

### Mobile
- [ ] Dialogues : pas de scroll horizontal parasite
- [ ] Champs date compacts
- [ ] Menu : déconnexion visible

### Prod (Vercel)
- [ ] `DATA_REMOTE=true`, auth papa OK
- [ ] Supabase : lignes visibles après saisie

---

## Ordre de saisie recommandé

1. Production (3 jours)  
2. Ventes (3 jours)  
3. Dépenses  
4. Trésorerie  
5. Calendrier → Personnalisé 25–27 mai → contrôler dashboard  
6. Rapports + exports
