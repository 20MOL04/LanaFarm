/**
 * Source unique — conditions « quoi notifier » (R1).
 * 11 règles essentielles — argent, stock, saisie, pertes.
 */

import { isSameDay, startOfDay } from "date-fns";

import { lastNDays } from "@/lib/dashboard-calc";
import { formatGNF, formatNumber, formatPercent } from "@/lib/format";
import {
  kpiAlveolesFerme,
  kpiPertesTotales,
  kpiResteAVerser,
  kpiStockMagasin,
} from "@/lib/kpi-sources";
import { aggregateProductions } from "@/lib/production-calc";
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
    input.depenses,
    input.tresorerie,
    cap,
    input.config
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

  // —— Pertes 7 j ——
  const sCur = lastNDays(today, 7);
  const prod7j = input.productions.filter((p) => {
    if (p.statut !== "actif") return false;
    const t = new Date(p.jourISO).getTime();
    return t >= sCur.start.getTime() && t <= sCur.end.getTime();
  });
  const productionDernier7j = aggregateProductions(prod7j, cap).productionEggs;
  const pertesDernier7j = kpiPertesTotales(
    input.productions,
    input.ventes,
    sCur.start,
    sCur.end,
    cap
  );
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

  return out;
}
