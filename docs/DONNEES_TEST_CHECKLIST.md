# Données de test manuelles — LanaFarm

> Plus de seed automatique. Saisir ces valeurs dans l’app pour valider KPI, formulaires et exports.  
> **Capacité plateau** : 30 œufs/alvéole (défaut config).

---

## 1. Production (3 jours — lun, mar, mer de la semaine courante)

| Jour | Ramassées (alv.) | Cassés (alv.) | Perdus (alv.) | Envoyées vente (alv.) |
|------|------------------|---------------|---------------|------------------------|
| Lun | 40 | 1 | 0 | 30 |
| Mar | 36 | 0 | 1 | 28 |
| Mer | 42 | 2 | 0 | 32 |

**À vérifier** : alvéoles entières uniquement, stock ferme, transfert auto « reçu » si envoyées > 0.

---

## 2. Ventes (mêmes jours, après production)

| Jour | Vendus (alv.) | Cassés vente (alv.) | Prix casier (GNF) |
|------|---------------|---------------------|-------------------|
| Lun | 25 | 0 | 37 000 |
| Mar | 20 | 1 | 38 000 |
| Mer | 28 | 0 | 37 000 |

**À vérifier** : montant = vendus × prix, stock magasin cohérent, pas de vente > stock dispo.

---

## 3. Dépenses

| Jour | Catégorie | Montant (GNF) |
|------|-----------|---------------|
| Lun | Alimentation animale | 450 000 |
| Mar | Transport | 75 000 |
| Mer | Main d'œuvre | 200 000 |

---

## 4. Trésorerie

| Jour | Reçu (GNF) | Versé (GNF) | Méthode |
|------|------------|-------------|---------|
| Lun | 900 000 | 500 000 | Espèces |
| Mer | 1 050 000 | 1 050 000 | Orange Money |

**À vérifier** : reste = reçu − versé.

---

## Checklist validation (cocher après test)

### Dashboard
- [ ] KPI stock ferme / stock magasin affichés
- [ ] Chiffre d’affaires, dépenses, profit cohérents
- [ ] Graphique activité (7 jours) avec barres

### Production
- [ ] Ajouter un jour (dialogue)
- [ ] Modifier / annuler / restaurer
- [ ] Multi-jours sans doublon même jour actif
- [ ] Message erreur si 2 productions actives même jour

### Ventes
- [ ] Ajouter vente, prix libre
- [ ] Stock magasin diminue logiquement

### Dépenses & Trésorerie
- [ ] Catégories et méthodes depuis config
- [ ] Totaux dashboard mis à jour

### Notifications (cloche)
- [ ] Alertes générées si seuils dépassés (paramètres)
- [ ] Lu / non lu, persistance après F5 (si Supabase remote)

### Rapports
- [ ] Générer rapport mensuel
- [ ] Export PDF avec logo
- [ ] Export Excel avec logo
- [ ] Impression A4 lisible

### Mobile
- [ ] Menu : pas de contour blanc, déconnexion visible en bas
- [ ] Champs : pas de zoom bloqué après clavier
- [ ] Formulaires dialogues utilisables

### Auth & données
- [ ] Login papa / toi
- [ ] Données restent après F5 (Vercel + `DATA_REMOTE=true`)
- [ ] Supabase Table Editor : lignes visibles après saisie
