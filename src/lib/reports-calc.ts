/**
 * Agrégateur dédié au module Rapports.
 *
 * Réutilise STRICTEMENT les helpers existants — pas une seule formule métier
 * réécrite ici :
 *   - production-calc / sales-calc / expenses-calc / tresorerie-calc
 *   - transfers-calc (stock magasin cumulatif)
 *   - dashboard-calc (KPI snapshot)
 *
 * Ajoute uniquement :
 *   - `productionTotale` au snapshot (utile pour la synthèse rapports)
 *   - métadonnées de saisie par module (volumes, top-éléments)
 *   - structures de tables compactes prêtes à imprimer
 *   - calcul de marge (%)
 */

import { formatGNF, formatNumber } from "@/lib/format";
import { aggregateExpenses, type ExpensesTotals } from "@/lib/expenses-calc";
import { aggregateTresorerie, type TresorerieTotals } from "@/lib/tresorerie-calc";
import {
  aggregateProductions,
  type ProductionTotals,
} from "@/lib/production-calc";
import { aggregateSales, type SalesTotals } from "@/lib/sales-calc";
import { aggregateTransfers } from "@/lib/transfers-calc";
import {
  buildActivityTimeline,
  buildDashboardKpis,
  type ActivityPoint,
  type DashboardKpiSnapshot,
  type DashboardAggregateInput,
} from "@/lib/dashboard-calc";
import { resolveCategorieLabel, resolveMethodeLabel } from "@/lib/config-defaults";
import { formatDay } from "@/lib/date-ranges";
import { calcReste } from "@/lib/tresorerie-calc";
import { calcSaleLineMontant } from "@/lib/sales-calc";
import { calcAlveolesRestantesJour } from "@/lib/production-calc";
import { eggsToTrays } from "@/lib/units";
import type { FarmConfig, FarmProfil } from "@/types/domain";
import {
  formatAlveolesNumber,
  formatEggsNumber,
  KPI_LABEL,
  SALES_LABEL,
  UNIT_ALVEOLES,
  UNIT_OEUFS,
} from "@/lib/terminology";
import type {
  Depense,
  Tresorerie,
  Production,
  TransfertStock,
  Vente,
} from "@/types/domain";

/* ===========================================================
   Snapshot complet
   =========================================================== */

export type ReportKpiSnapshot = DashboardKpiSnapshot & {
  /** Nb saisies actives par module sur la période. */
  saisies: {
    production: number;
    ventes: number;
    depenses: number;
    tresorerie: number;
    transferts: number;
  };
  /** Marge brute (CA - Dépenses) / CA — en % entier ; null si CA = 0. */
  margeBrutePct: number | null;
};

export type ReportSummaryInput = DashboardAggregateInput;

export function buildReportSnapshot(input: ReportSummaryInput): ReportKpiSnapshot {
  const base = buildDashboardKpis(input);
  const prod = aggregateProductions(input.productionsInRange, input.capacitePlateau);
  const sales = aggregateSales(
    input.ventesInRange,
    input.productionsInRange,
    input.capacitePlateau
  );
  const exp = aggregateExpenses(input.depensesInRange);
  const deps = aggregateTresorerie(input.tresorerieInRange);
  const transfertsInRange = input.allTransferts.filter((t) => {
    const ts = new Date(t.jourEnvoiISO).getTime();
    return ts >= input.rangeEnd.getTime() - 86_400_000 * 90 && ts <= input.rangeEnd.getTime();
  });
  const tAgg = aggregateTransfers(transfertsInRange);

  const margeBrutePct =
    sales.montant > 0
      ? Math.round(((sales.montant - exp.total) / sales.montant) * 100)
      : null;

  return {
    ...base,
    saisies: {
      production: prod.saisies,
      ventes: sales.saisies,
      depenses: exp.saisies,
      tresorerie: deps.saisies,
      transferts: tAgg.total,
    },
    margeBrutePct,
  };
}

/* ===========================================================
   Tables compactes (résumés par module)
   =========================================================== */

export type SummaryRowVariant = "default" | "broken-eggs";

export type ProductionSummaryRow = {
  label: string;
  value: string;
  hint?: string;
  /** Valeur affichée avec le token danger (œufs cassés / pertes). */
  variant?: SummaryRowVariant;
};

export function buildProductionSummary(
  productions: Production[],
  capacitePlateau = 30
): { totals: ProductionTotals; rows: ProductionSummaryRow[] } {
  const totals = aggregateProductions(productions, capacitePlateau);
  return {
    totals,
    rows: [
      {
        label: KPI_LABEL.alveolesRamassees,
        value: formatAlveolesNumber(totals.alveolesRamassees),
      },
      {
        label: KPI_LABEL.alveolesMisesEnVente,
        value: formatAlveolesNumber(totals.alveolesMisesEnVente),
      },
      {
        label: KPI_LABEL.alveolesRestantes,
        value: formatAlveolesNumber(totals.alveolesRestantes),
      },
      {
        label: KPI_LABEL.oeufsCasses,
        value: formatEggsNumber(totals.oeufsCasses),
        variant: "broken-eggs",
      },
      { label: "Saisies actives", value: `${totals.saisies}` },
    ],
  };
}

export type SalesSummaryRow = ProductionSummaryRow;

export function buildSalesSummary(
  ventes: Vente[],
  productions: Production[],
  capacitePlateau = 30
): { totals: SalesTotals; rows: SalesSummaryRow[] } {
  const totals = aggregateSales(ventes, productions, capacitePlateau);
  const prixMoyen =
    totals.alveolesVendues > 0
      ? Math.round(totals.montant / totals.alveolesVendues)
      : 0;
  return {
    totals,
    rows: [
      {
        label: SALES_LABEL.alveolesVendues,
        value: formatAlveolesNumber(totals.alveolesVendues),
      },
      {
        label: KPI_LABEL.oeufsCasses,
        value: formatEggsNumber(totals.casses),
        variant: "broken-eggs",
      },
      { label: "Chiffre d'affaires", value: formatGNF(totals.montant) },
      {
        label: SALES_LABEL.prixCasier,
        value: prixMoyen > 0 ? formatGNF(prixMoyen) : "—",
        hint: "Moyenne pondérée sur la période",
      },
      { label: "Saisies actives", value: `${totals.saisies}` },
    ],
  };
}

export type ExpensesSummaryRow = ProductionSummaryRow;

export function buildExpensesSummary(
  depenses: Depense[]
): { totals: ExpensesTotals; rows: ExpensesSummaryRow[] } {
  const totals = aggregateExpenses(depenses);
  return {
    totals,
    rows: [
      { label: "Total dépenses", value: formatGNF(totals.total) },
      {
        label: "Catégorie principale",
        value: totals.topCategorie ? totals.topCategorie.label : "—",
        hint: totals.topCategorie
          ? `${formatGNF(totals.topCategorie.montant)} · ${formatNumber(totals.topCategorie.part)} %`
          : undefined,
      },
      {
        label: "Moyenne journalière",
        value: formatGNF(totals.moyenneJournaliere),
        hint: `${totals.joursActifs} j actifs`,
      },
      { label: "Saisies actives", value: `${totals.saisies}` },
    ],
  };
}

export type TreasurySummaryRow = ProductionSummaryRow;

export function buildTreasurySummary(
  tresorerie: Tresorerie[]
): { totals: TresorerieTotals; rows: TreasurySummaryRow[] } {
  const totals = aggregateTresorerie(tresorerie);
  return {
    totals,
    rows: [
      { label: "Total reçu", value: formatGNF(totals.totalRecu) },
      { label: "Montant versé", value: formatGNF(totals.totalDepose) },
      {
        label: "Reste à verser",
        value: formatGNF(totals.enAttente),
        hint: "Encaissements non encore versés",
      },
      {
        label: "Méthode principale",
        value: totals.topMethode ? totals.topMethode.label : "—",
        hint: totals.topMethode
          ? `${totals.topMethode.part} % des recettes`
          : undefined,
      },
      { label: "Saisies actives", value: `${totals.saisies}` },
    ],
  };
}

/* ===========================================================
   Lignes détail (feuilles Excel / annexes print)
   =========================================================== */

export type ReportType = "weekly" | "monthly" | "custom";

export type ProductionDetailRow = {
  jour: string;
  ramassees: number;
  misesVente: number;
  casses: number;
  perdus: number;
  restantes: number;
  statut: string;
  notes: string;
};

export type VenteDetailRow = {
  jour: string;
  vendus: number;
  cassesVente: number;
  prix: number;
  montant: number;
  client: string;
  statut: string;
};

export type DepenseDetailRow = {
  jour: string;
  categorie: string;
  montant: number;
  description: string;
  statut: string;
};

export type TresorerieDetailRow = {
  jour: string;
  montantRecu: number;
  depose: number;
  reste: number;
  methode: string;
  statut: string;
  note: string;
};

export type TransfertDetailRow = {
  jour: string;
  quantiteEnvoyee: number;
  quantiteRecue: number | null;
  ecart: number | null;
  statut: string;
  note: string;
};

function entryInRange(jourISO: string, from: Date, to: Date): boolean {
  const t = new Date(jourISO).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function buildProductionDetailRows(
  productions: Production[],
  capacitePlateau: number,
  rangeStart: Date,
  rangeEnd: Date
): ProductionDetailRow[] {
  return productions
    .filter((p) => entryInRange(p.jourISO, rangeStart, rangeEnd))
    .sort((a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime())
    .map((p) => ({
      jour: formatDay(new Date(p.jourISO)),
      ramassees: Math.round(eggsToTrays(p.production, capacitePlateau)),
      misesVente: Math.round(eggsToTrays(p.envoyesVente, capacitePlateau)),
      casses: p.casses,
      perdus: p.perdus ?? 0,
      restantes: Math.round(calcAlveolesRestantesJour(p, capacitePlateau)),
      statut: p.statut,
      notes: p.notes?.trim() ?? "",
    }));
}

export function buildVenteDetailRows(
  ventes: Vente[],
  capacitePlateau: number,
  rangeStart: Date,
  rangeEnd: Date
): VenteDetailRow[] {
  return ventes
    .filter((v) => entryInRange(v.jourISO, rangeStart, rangeEnd))
    .sort((a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime())
    .map((v) => ({
      jour: formatDay(new Date(v.jourISO)),
      vendus: Math.round(eggsToTrays(v.vendus, capacitePlateau)),
      cassesVente: v.cassesVente,
      prix: v.prix,
      montant: calcSaleLineMontant(v.vendus, v.prix, capacitePlateau),
      client: v.client?.trim() ?? "",
      statut: v.statut,
    }));
}

export function buildDepenseDetailRows(
  depenses: Depense[],
  config: FarmConfig,
  rangeStart: Date,
  rangeEnd: Date
): DepenseDetailRow[] {
  return depenses
    .filter((d) => entryInRange(d.jourISO, rangeStart, rangeEnd))
    .sort((a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime())
    .map((d) => ({
      jour: formatDay(new Date(d.jourISO)),
      categorie: resolveCategorieLabel(
        d.categorie,
        config.listes.categoriesDepense
      ),
      montant: d.montant,
      description: d.description?.trim() ?? "",
      statut: d.statut,
    }));
}

export function buildTresorerieDetailRows(
  tresorerie: Tresorerie[],
  config: FarmConfig,
  rangeStart: Date,
  rangeEnd: Date
): TresorerieDetailRow[] {
  return tresorerie
    .filter((t) => entryInRange(t.jourISO, rangeStart, rangeEnd))
    .sort((a, b) => new Date(b.jourISO).getTime() - new Date(a.jourISO).getTime())
    .map((t) => ({
      jour: formatDay(new Date(t.jourISO)),
      montantRecu: t.montantRecu,
      depose: t.depose,
      reste: calcReste(t),
      methode: resolveMethodeLabel(t.methode, config.listes.methodesPaiement),
      statut: t.statut,
      note: t.note?.trim() ?? "",
    }));
}

export function buildTransfertDetailRows(
  transferts: TransfertStock[],
  capacitePlateau: number,
  rangeStart: Date,
  rangeEnd: Date
): TransfertDetailRow[] {
  return transferts
    .filter((t) => entryInRange(t.jourEnvoiISO, rangeStart, rangeEnd))
    .sort(
      (a, b) =>
        new Date(b.jourEnvoiISO).getTime() - new Date(a.jourEnvoiISO).getTime()
    )
    .map((t) => ({
      jour: formatDay(new Date(t.jourEnvoiISO)),
      quantiteEnvoyee: eggsToTrays(t.quantiteEnvoyee, capacitePlateau),
      quantiteRecue:
        t.quantiteRecue != null
          ? eggsToTrays(t.quantiteRecue, capacitePlateau)
          : null,
      ecart:
        t.ecart != null ? eggsToTrays(t.ecart, capacitePlateau) : null,
      statut: t.statut,
      note: t.noteEcart?.trim() ?? "",
    }));
}

/* ===========================================================
   Payload export — structure unique (Excel / PDF / historique)
   =========================================================== */

export type ReportPayload = {
  generatedAt: string;
  periodLabel: string;
  fromISO: string;
  toISO: string;
  type: ReportType;
  farm: FarmProfil;
  capacitePlateau: number;
  kpis: ReportKpiSnapshot;
  productionRows: ProductionSummaryRow[];
  salesRows: SalesSummaryRow[];
  expensesRows: ExpensesSummaryRow[];
  treasuryRows: TreasurySummaryRow[];
  detail: {
    production: ProductionDetailRow[];
    ventes: VenteDetailRow[];
    depenses: DepenseDetailRow[];
    tresorerie: TresorerieDetailRow[];
    transferts: TransfertDetailRow[];
  };
  timeline: ActivityPoint[];
};

export function buildReportPayload(args: {
  snapshot: ReportKpiSnapshot;
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
  transferts: TransfertStock[];
  farm: FarmProfil;
  config: FarmConfig;
  capacitePlateau: number;
  rangeStart: Date;
  rangeEnd: Date;
  fromISO: string;
  toISO: string;
  periodLabel: string;
  type: ReportType;
  timeline?: ActivityPoint[];
}): ReportPayload {
  const cap = args.capacitePlateau;
  const rs = args.rangeStart;
  const re = args.rangeEnd;
  return {
    generatedAt: new Date().toISOString(),
    periodLabel: args.periodLabel,
    fromISO: args.fromISO,
    toISO: args.toISO,
    type: args.type,
    farm: args.farm,
    capacitePlateau: cap,
    kpis: args.snapshot,
    productionRows: buildProductionSummary(args.productions, cap).rows,
    salesRows: buildSalesSummary(args.ventes, args.productions, cap).rows,
    expensesRows: buildExpensesSummary(args.depenses).rows,
    treasuryRows: buildTreasurySummary(args.tresorerie).rows,
    detail: {
      production: buildProductionDetailRows(args.productions, cap, rs, re),
      ventes: buildVenteDetailRows(args.ventes, cap, rs, re),
      depenses: buildDepenseDetailRows(args.depenses, args.config, rs, re),
      tresorerie: buildTresorerieDetailRows(
        args.tresorerie,
        args.config,
        rs,
        re
      ),
      transferts: buildTransfertDetailRows(args.transferts, cap, rs, re),
    },
    timeline:
      args.timeline ??
      buildActivityTimeline(rs, re, args.productions, args.ventes, args.depenses, cap),
  };
}
