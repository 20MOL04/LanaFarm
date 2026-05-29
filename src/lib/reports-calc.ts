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
import {
  kpiAlveolesMisesEnVente,
  kpiAlveolesRamassees,
  kpiAlveolesRestantesPeriode,
  kpiCA,
  kpiDepenses,
  kpiMargeBrutePct,
  kpiPrixMoyenVente,
  kpiResteAVerser,
  kpiTresorerieRecuPeriode,
  kpiTresorerieVersePeriode,
} from "@/lib/kpi-sources";
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
  const cap = input.capacitePlateau;
  const rangeStart = input.rangeStart;
  const rangeEnd = input.rangeEnd;
  const prod = aggregateProductions(input.productionsInRange, cap);
  const sales = aggregateSales(
    input.ventesInRange,
    input.productionsInRange,
    cap
  );
  const exp = aggregateExpenses(input.depensesInRange);
  const deps = aggregateTresorerie(input.tresorerieInRange);
  const transfertsInRange = input.allTransferts.filter((t) => {
    const ts = new Date(t.jourEnvoiISO).getTime();
    return ts >= input.rangeEnd.getTime() - 86_400_000 * 90 && ts <= input.rangeEnd.getTime();
  });
  const tAgg = aggregateTransfers(transfertsInRange);

  const margeBrutePct = kpiMargeBrutePct(
    input.allVentes,
    input.allDepenses,
    rangeStart,
    rangeEnd,
    cap,
    input.config
  );

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
  capacitePlateau = 30,
  rangeStart: Date,
  rangeEnd: Date
): { totals: ProductionTotals; rows: ProductionSummaryRow[] } {
  const totals = aggregateProductions(productions, capacitePlateau);
  const ramassees = kpiAlveolesRamassees(productions, capacitePlateau);
  const mises = kpiAlveolesMisesEnVente(productions, capacitePlateau);
  const restantes = kpiAlveolesRestantesPeriode(
    productions,
    rangeStart,
    rangeEnd,
    capacitePlateau
  );
  return {
    totals,
    rows: [
      {
        label: KPI_LABEL.alveolesRamassees,
        value: formatAlveolesNumber(ramassees),
      },
      {
        label: KPI_LABEL.alveolesMisesEnVente,
        value: formatAlveolesNumber(mises),
      },
      {
        label: KPI_LABEL.restantesPeriode,
        value: formatAlveolesNumber(restantes),
        hint: "Σ restantes par jour sur la période",
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
  capacitePlateau = 30,
  rangeStart: Date,
  rangeEnd: Date
): { totals: SalesTotals; rows: SalesSummaryRow[] } {
  const totals = aggregateSales(ventes, productions, capacitePlateau);
  const ca = kpiCA(ventes, rangeStart, rangeEnd, capacitePlateau);
  const prixMoyen = kpiPrixMoyenVente(ventes, rangeStart, rangeEnd, capacitePlateau);
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
      { label: KPI_LABEL.chiffreAffaires, value: formatGNF(ca) },
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
  depenses: Depense[],
  rangeStart: Date,
  rangeEnd: Date,
  config: FarmConfig
): { totals: ExpensesTotals; rows: ExpensesSummaryRow[] } {
  const totals = aggregateExpenses(depenses);
  const totalKpi = kpiDepenses(depenses, rangeStart, rangeEnd, config);
  return {
    totals,
    rows: [
      { label: KPI_LABEL.totalDepenses, value: formatGNF(totalKpi) },
      {
        label: KPI_LABEL.categoriePrincipale,
        value: totals.topCategorie ? totals.topCategorie.label : "—",
        hint: totals.topCategorie
          ? `${formatGNF(totals.topCategorie.montant)} · ${formatNumber(totals.topCategorie.part)} %`
          : undefined,
      },
      {
        label: KPI_LABEL.moyenneJour,
        value: formatGNF(totals.moyenneJournaliere),
        hint: `${totals.joursActifs} j actifs`,
      },
      { label: "Saisies actives", value: `${totals.saisies}` },
    ],
  };
}

export type TreasurySummaryRow = ProductionSummaryRow;

export function buildTreasurySummary(args: {
  tresorerieInRange: Tresorerie[];
  allTresorerie: Tresorerie[];
  ventes: Vente[];
  depenses: Depense[];
  config: FarmConfig;
  capacitePlateau: number;
  rangeStart: Date;
  rangeEnd: Date;
}): { totals: TresorerieTotals; rows: TreasurySummaryRow[] } {
  const totals = aggregateTresorerie(args.tresorerieInRange, args.config);
  const totalRecu = kpiTresorerieRecuPeriode(
    args.allTresorerie,
    args.rangeStart,
    args.rangeEnd
  );
  const totalVerse = kpiTresorerieVersePeriode(
    args.allTresorerie,
    args.rangeStart,
    args.rangeEnd
  );
  const resteAVerser = kpiResteAVerser(
    args.ventes,
    args.depenses,
    args.allTresorerie,
    args.capacitePlateau,
    args.config
  );
  return {
    totals,
    rows: [
      { label: KPI_LABEL.totalRecu, value: formatGNF(totalRecu) },
      { label: KPI_LABEL.montantVerse, value: formatGNF(totalVerse) },
      {
        label: KPI_LABEL.resteAVerser,
        value: formatGNF(resteAVerser),
        hint: "Cumul global (CA − dépenses − versé)",
      },
      {
        label: KPI_LABEL.methodePrincipale,
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
  allVentes: Vente[];
  allDepenses: Depense[];
  allTresorerie: Tresorerie[];
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
    productionRows: buildProductionSummary(
      args.productions,
      cap,
      rs,
      re
    ).rows,
    salesRows: buildSalesSummary(args.ventes, args.productions, cap, rs, re).rows,
    expensesRows: buildExpensesSummary(args.depenses, rs, re, args.config).rows,
    treasuryRows: buildTreasurySummary({
      tresorerieInRange: args.tresorerie,
      allTresorerie: args.allTresorerie,
      ventes: args.allVentes,
      depenses: args.allDepenses,
      config: args.config,
      capacitePlateau: args.capacitePlateau,
      rangeStart: rs,
      rangeEnd: re,
    }).rows,
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
      buildActivityTimeline(
        rs,
        re,
        args.productions,
        args.ventes,
        args.depenses,
        cap,
        args.config
      ),
  };
}
