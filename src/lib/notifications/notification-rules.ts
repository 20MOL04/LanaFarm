/**
 * Source unique — conditions « quoi notifier » (R1).
 * Portage de buildDashboardInsights + catalogue cahier v2.0.
 */

import { isSameDay, startOfDay, subDays } from "date-fns";

import { lastNDays } from "@/lib/dashboard-calc";
import { formatGNF, formatNumber, formatPercent } from "@/lib/format";
import {
  kpiAlveolesFerme,
  kpiProfit,
  kpiResteAVerser,
  kpiStockMagasin,
} from "@/lib/kpi-sources";
import { aggregateTransfers } from "@/lib/transfers-calc";
import type {
  Depense,
  FarmConfig,
  Production,
  Tresorerie,
  TransfertStock,
  Vente,
} from "@/types/domain";
import type { NotificationDraft } from "@/types/notifications";

export type NotificationRulesInput = {
  productions: Production[];
  ventes: Vente[];
  depenses: Depense[];
  tresorerie: Tresorerie[];
  transferts: TransfertStock[];
  config: FarmConfig;
  now?: Date;
};

function hasActiveEntryOnDay(
  entries: { jourISO: string; statut: string }[],
  day: Date
): boolean {
  return entries.some(
    (e) => e.statut === "actif" && isSameDay(new Date(e.jourISO), day)
  );
}

function sumDepensesRange(depenses: Depense[], start: Date, end: Date): number {
  let total = 0;
  for (const d of depenses) {
    if (d.statut !== "actif") continue;
    const t = new Date(d.jourISO).getTime();
    if (t >= start.getTime() && t <= end.getTime()) total += d.montant;
  }
  return total;
}

function sumProductionJour(productions: Production[], target: Date): number {
  let q = 0;
  for (const p of productions) {
    if (p.statut !== "actif") continue;
    if (isSameDay(new Date(p.jourISO), target)) q += p.production;
  }
  return q;
}

function listesIncompletes(config: FarmConfig): boolean {
  const cats = config.listes.categoriesDepense.filter((c) => c.actif);
  const meths = config.listes.methodesPaiement.filter((m) => m.actif);
  if (cats.length < 2 || meths.length < 2) return true;
  return (
    cats.some((c) => !c.label.trim()) || meths.some((m) => !m.label.trim())
  );
}

/**
 * Évalue toutes les règles actives — retourne les brouillons à synchroniser.
 */
export function evaluateNotificationRules(
  input: NotificationRulesInput
): NotificationDraft[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const cap = input.config.preferences.capacitePlateau;
  const seuils = input.config.seuils;
  const out: NotificationDraft[] = [];

  const stockMagasinOeufs =
    kpiStockMagasin(input.transferts, input.ventes, cap) * cap;
  const seuilStockOeufs = seuils.stockMagasinFaiblePlateaux * cap;
  const stockFermeAlveoles = kpiAlveolesFerme(
    input.productions,
    input.transferts,
    cap
  );
  const resteAVerser = kpiResteAVerser(
    input.ventes,
    input.tresorerie,
    cap
  );

  // —— Stock magasin ——
  if (stockMagasinOeufs < 0) {
    out.push({
      key: "stock-magasin-negative",
      level: "critical",
      module: "ventes",
      title: "Stock vente incohérent",
      description:
        "Le cumul indique un stock vente négatif — vérifie les transferts contestés ou des ventes sans réception.",
      href: "/ventes",
    });
  } else if (seuilStockOeufs > 0 && stockMagasinOeufs < seuilStockOeufs) {
    out.push({
      key: "stock-magasin-low",
      level: "important",
      module: "ventes",
      title: "Stock vente faible",
      description: `Stock vente sous le seuil de ${seuils.stockMagasinFaiblePlateaux} alvéole${seuils.stockMagasinFaiblePlateaux > 1 ? "s" : ""}.`,
      href: "/ventes",
      meta: { seuilKey: "stockMagasinFaiblePlateaux" },
    });
  } else if (seuilStockOeufs > 0 && stockMagasinOeufs >= seuilStockOeufs) {
    out.push({
      key: "stock-retabli",
      level: "positive",
      module: "ventes",
      title: "Stock vente rétabli",
      description: "Le stock vente est de nouveau au-dessus du seuil configuré.",
      href: "/ventes",
    });
  }

  // —— Stock ferme ——
  if (stockFermeAlveoles <= 0) {
    out.push({
      key: "stock-ferme-epuise",
      level: "critical",
      module: "production",
      title: "Stock ferme épuisé",
      description: "Aucune alvéole disponible à la ferme pour un nouvel envoi.",
      href: "/production",
    });
  }

  // —— Transferts ——
  const tAgg = aggregateTransfers(input.transferts);
  const enAttente = tAgg.parStatut.en_attente;
  const contestes = tAgg.parStatut.conteste;
  if (contestes > 0) {
    out.push({
      key: "transfert-conteste",
      level: "critical",
      module: "transferts",
      title: "Transfert(s) contesté(s)",
      description: `${contestes} transfert${contestes > 1 ? "s" : ""} contesté${contestes > 1 ? "s" : ""} — à régulariser.`,
      href: "/ventes",
      query: { focus: "receptions" },
    });
  } else if (enAttente > 0) {
    out.push({
      key: "transfert-en-attente",
      level: "important",
      module: "transferts",
      title: "Transfert(s) en attente",
      description: `${enAttente} transfert${enAttente > 1 ? "s" : ""} en attente de confirmation.`,
      href: "/ventes",
      query: { focus: "receptions" },
    });
  }

  // —— Versement > reçu ——
  const depotIncoherent = input.tresorerie.some(
    (t) => t.statut === "actif" && t.depose > t.montantRecu
  );
  if (depotIncoherent) {
    out.push({
      key: "depot-superieur-recu",
      level: "critical",
      module: "tresorerie",
      title: "Versement supérieur au reçu",
      description:
        "Au moins une ligne trésorerie a un montant versé supérieur au montant reçu.",
      href: "/tresorerie",
    });
  }

  // —— Dépenses / profit semaine ——
  const sCur = lastNDays(today, 7);
  const sPrev = lastNDays(
    new Date(sCur.start.getTime() - 24 * 60 * 60 * 1000),
    7
  );
  const depActuelle = sumDepensesRange(input.depenses, sCur.start, sCur.end);
  const depPrecedente = sumDepensesRange(input.depenses, sPrev.start, sPrev.end);
  if (depPrecedente > 0 && depActuelle > depPrecedente * 1.15) {
    const ecart = Math.round(((depActuelle - depPrecedente) / depPrecedente) * 100);
    out.push({
      key: "depenses-hausse",
      level: "important",
      module: "depenses",
      title: "Dépenses en hausse",
      description: `+${ecart} % par rapport à la semaine précédente.`,
      href: "/depenses",
    });
  }

  const profitActuel = kpiProfit(
    input.ventes,
    input.depenses,
    sCur.start,
    sCur.end,
    cap
  );
  const profitPrecedent = kpiProfit(
    input.ventes,
    input.depenses,
    sPrev.start,
    sPrev.end,
    cap
  );
  if (profitPrecedent > 0 && profitActuel < profitPrecedent) {
    const ecart = Math.round(
      ((profitPrecedent - profitActuel) / profitPrecedent) * 100
    );
    out.push({
      key: "profit-baisse",
      level: "important",
      module: "rapports",
      title: "Profit en baisse",
      description: `Estimation en recul de ${ecart} % sur la semaine.`,
      href: "/rapports",
      query: { preset: "week" },
    });
  } else if (profitPrecedent > 0 && profitActuel > profitPrecedent) {
    const ecart = Math.round(
      ((profitActuel - profitPrecedent) / profitPrecedent) * 100
    );
    out.push({
      key: "profit-hausse",
      level: "positive",
      module: "rapports",
      title: "Le profit progresse",
      description: `+${ecart} % par rapport à la semaine précédente.`,
      href: "/rapports",
      query: { preset: "week" },
    });
  }

  // —— Pertes 7 j ——
  let productionDernier7j = 0;
  let pertesDernier7j = 0;
  for (const p of input.productions) {
    if (p.statut !== "actif") continue;
    const t = new Date(p.jourISO).getTime();
    if (t >= sCur.start.getTime() && t <= sCur.end.getTime()) {
      productionDernier7j += p.production;
      pertesDernier7j += p.casses + (p.perdus ?? 0);
    }
  }
  for (const v of input.ventes) {
    if (v.statut !== "actif") continue;
    const t = new Date(v.jourISO).getTime();
    if (t >= sCur.start.getTime() && t <= sCur.end.getTime()) {
      pertesDernier7j += v.cassesVente;
    }
  }
  if (productionDernier7j > 0 && seuils.pertesHebdoMaxPct > 0) {
    const pctPertes = (pertesDernier7j / productionDernier7j) * 100;
    if (pctPertes > seuils.pertesHebdoMaxPct) {
      out.push({
        key: "pertes-seuil-depasse",
        level: "important",
        module: "production",
        title: "Pertes anormales (7 j)",
        description: `${formatPercent(pctPertes, false)} d'œufs cassés sur 7 jours — au-dessus du seuil de ${formatNumber(seuils.pertesHebdoMaxPct)} %.`,
        href: "/production",
        meta: { seuilKey: "pertesHebdoMaxPct" },
      });
    }
  }

  // —— Trésorerie ——
  if (resteAVerser > 0) {
    const depasseSeuil = resteAVerser > seuils.tresorerieEnAttenteMaxGNF;
    if (depasseSeuil) {
      out.push({
        key: "reste-a-verser-high",
        level: "important",
        module: "tresorerie",
        title: "Reste à verser élevé",
        description: `${formatGNF(resteAVerser)} — seuil dépassé.`,
        href: "/tresorerie",
        meta: {
          seuilKey: "tresorerieEnAttenteMaxGNF",
          montantGNF: resteAVerser,
        },
      });
    } else {
      out.push({
        key: "reste-a-verser-info",
        level: "normal",
        module: "tresorerie",
        title: "Reste à verser",
        description: `${formatGNF(resteAVerser)} encore à verser.`,
        href: "/tresorerie",
        meta: { montantGNF: resteAVerser },
      });
    }
  } else {
    out.push({
      key: "tresorerie-a-jour",
      level: "positive",
      module: "tresorerie",
      title: "Trésorerie à jour",
      description: "Aucun reste à verser en attente.",
      href: "/tresorerie",
    });
  }

  // —— Saisies du jour ——
  const hier = subDays(today, 1);
  if (!hasActiveEntryOnDay(input.productions, today)) {
    out.push({
      key: "production-jour-manquante",
      level: "important",
      module: "production",
      title: "Pas de production aujourd'hui",
      description: "Aucune saisie production pour la journée en cours.",
      href: "/production",
      query: { action: "ajouter" },
      meta: { jourISO: today.toISOString() },
    });
  }
  if (!hasActiveEntryOnDay(input.ventes, today)) {
    out.push({
      key: "vente-jour-manquante",
      level: "important",
      module: "ventes",
      title: "Pas de vente aujourd'hui",
      description: "Aucune vente enregistrée pour la journée en cours.",
      href: "/ventes",
      query: { action: "ajouter" },
      meta: { jourISO: today.toISOString() },
    });
  }

  // —— Listes ——
  if (listesIncompletes(input.config)) {
    out.push({
      key: "listes-incompletes",
      level: "important",
      module: "parametres",
      title: "Listes métier incomplètes",
      description:
        "Vérifie les catégories de dépenses et les méthodes de paiement dans les paramètres.",
      href: "/parametres",
      query: { section: "listes" },
    });
  }

  // —— Fallback positif (si aucune alerte critique/importante) ——
  const hasSerious = out.some(
    (d) => d.level === "critical" || d.level === "important"
  );
  if (!hasSerious) {
    const jourN = sumProductionJour(input.productions, hier);
    const jourN1 = sumProductionJour(input.productions, subDays(hier, 1));
    if (jourN > 0) {
      out.push({
        key: "tout-controle",
        level: "positive",
        module: "system",
        title: "Tout est sous contrôle",
        description:
          jourN === jourN1
            ? "La production est stable et les flux financiers sont synchronisés."
            : `Production récente enregistrée.`,
        href: "/dashboard",
      });
    } else {
      out.push({
        key: "pret-saisie",
        level: "normal",
        module: "production",
        title: "Prêt à saisir la journée",
        description: "Aucune anomalie. Saisis tes premières opérations du jour.",
        href: "/production",
        query: { action: "ajouter" },
      });
    }
  }

  return out;
}
