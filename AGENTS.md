<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LANAFARM — RÈGLES AGENTS IA

## RÈGLE KPI — SOURCE UNIQUE OBLIGATOIRE

Avant de calculer ou afficher un KPI,
tu DOIS vérifier src/lib/kpi-sources.ts.

Chaque KPI a UNE SEULE fonction source.
Tu IMPORTES depuis kpi-sources.ts.
Tu ne calcules JAMAIS inline dans un
composant, hook ou autre lib.

### LISTE DES SOURCES OFFICIELLES

| KPI | Fonction | Type |
|-----|----------|------|
| Alvéoles dispo Ferme | kpiAlveolesFerme() | FIXE |
| Stock magasin | kpiStockMagasin() | FIXE |
| Reste à verser | kpiResteAVerser() | FIXE |
| Chiffre d'affaires | kpiCA() | PÉRIODE |
| Dépenses | kpiDepenses() | PÉRIODE |
| Profit | kpiProfit() | PÉRIODE |
| Alvéoles ramassées | kpiAlveolesRamassees() | PÉRIODE |
| Alvéoles mises en vente | kpiAlveolesMisesEnVente() | PÉRIODE |
| Montant versé | kpiMontantVerse() | PÉRIODE |
| Pertes totales | kpiPertesTotales() | PÉRIODE |

### SI TU VOIS UNE DUPLICATION

Si tu trouves un composant qui calcule
un KPI autrement qu'en appelant
kpi-sources.ts → REFUSER d'ajouter
une nouvelle duplication.
Corriger l'existant pour utiliser
la source officielle.

### MODIFIER UN CALCUL

Si une règle métier change pour un KPI :
1. Modifier UNIQUEMENT kpi-sources.ts
2. Tous les composants héritent
   automatiquement de la correction.
3. Ne jamais modifier le calcul
   dans le composant directement.
