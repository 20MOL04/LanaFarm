import { startOfDay } from "date-fns";

import { navigation, quickActions } from "@/config/navigation";
import {
  MODULE_LABEL,
  TYPE_LABEL,
  getActionUserLabel,
} from "@/lib/action-display";
import {
  resolveCategorieLabel,
  resolveMethodeLabel,
} from "@/lib/config-defaults";
import { formatDay, toIsoDate } from "@/lib/date-ranges";
import type { FarmSearchDataSource } from "@/lib/global-search/farm-data-source";
import { formatSearchDayLabel } from "@/lib/global-search/parse-query";
import { normalizeSearchText } from "@/lib/global-search/normalize";
import type { GlobalSearchEntry } from "@/lib/global-search/types";
import { formatGNF } from "@/lib/format";
import { eggsToTrays } from "@/lib/units";
import { KPI_LABEL } from "@/lib/terminology";

function kw(...parts: (string | number | undefined | null)[]): string {
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

function dayHref(module: string, jourISO: string, q?: string): string {
  const params = new URLSearchParams();
  params.set("jour", jourISO);
  if (q) params.set("q", q);
  return `/${module}?${params.toString()}`;
}

function moduleHref(path: string, params: Record<string, string>): string {
  const sp = new URLSearchParams(params);
  return `${path}?${sp.toString()}`;
}

/** Construit l'index complet — appelé via useMemo sur le snapshot store. */
export function buildGlobalSearchIndex(
  data: FarmSearchDataSource
): GlobalSearchEntry[] {
  const cap = data.config.preferences.capacitePlateau;
  const entries: GlobalSearchEntry[] = [];

  for (const action of quickActions) {
    entries.push({
      id: `action:${action.href}`,
      kind: "action",
      group: "Actions rapides",
      title: action.label,
      subtitle: "Ouvrir directement",
      href: action.href,
      keywords: kw(action.label, "ajouter", "saisie", "nouveau"),
      priority: 100,
      icon: action.icon,
    });
  }

  for (const group of navigation) {
    for (const item of group.items) {
      entries.push({
        id: `page:${item.href}`,
        kind: "page",
        group: "Pages",
        title: item.label,
        subtitle: item.description ?? group.title,
        href: item.href,
        keywords: kw(item.label, item.description, group.title, "menu", "module"),
        priority: 90,
        icon: item.icon,
      });
    }
  }

  const daySet = new Set<string>();
  const addDay = (jourISO: string) => {
    try {
      daySet.add(toIsoDate(startOfDay(new Date(jourISO))));
    } catch {
      /* ignore invalid */
    }
  };

  for (const p of data.productions) addDay(p.jourISO);
  for (const v of data.ventes) addDay(v.jourISO);
  for (const d of data.depenses) addDay(d.jourISO);
  for (const t of data.tresorerie) addDay(t.jourISO);

  const sortedDays = [...daySet].sort((a, b) => b.localeCompare(a));

  for (const jourISO of sortedDays) {
    const label = formatSearchDayLabel(jourISO);
    const hasProd = data.productions.some(
      (p) => p.statut === "actif" && toIsoDate(new Date(p.jourISO)) === jourISO
    );
    const hasVente = data.ventes.some(
      (v) => v.statut === "actif" && toIsoDate(new Date(v.jourISO)) === jourISO
    );
    const hasDep = data.depenses.some(
      (d) => d.statut === "actif" && toIsoDate(new Date(d.jourISO)) === jourISO
    );
    const hasTre = data.tresorerie.some(
      (t) => t.statut === "actif" && toIsoDate(new Date(t.jourISO)) === jourISO
    );

    const modules: string[] = [];
    if (hasProd) modules.push("Production");
    if (hasVente) modules.push("Ventes");
    if (hasDep) modules.push("Dépenses");
    if (hasTre) modules.push("Trésorerie");

    entries.push({
      id: `day:${jourISO}:production`,
      kind: "day",
      group: "Jours",
      title: label,
      subtitle: modules.length ? modules.join(" · ") : "Aucune saisie active",
      href: dayHref("production", jourISO),
      keywords: kw(label, jourISO, formatDay(new Date(jourISO)), "jour", "date"),
      priority: 85,
      jourISO,
    });

    if (hasVente) {
      entries.push({
        id: `day:${jourISO}:ventes`,
        kind: "day",
        group: "Jours",
        title: `${label} — Ventes`,
        subtitle: "Voir les ventes du jour",
        href: dayHref("ventes", jourISO),
        keywords: kw(label, jourISO, "vente", "client"),
        priority: 84,
        jourISO,
      });
    }
    if (hasDep) {
      entries.push({
        id: `day:${jourISO}:depenses`,
        kind: "day",
        group: "Jours",
        title: `${label} — Dépenses`,
        subtitle: "Voir les dépenses du jour",
        href: dayHref("depenses", jourISO),
        keywords: kw(label, jourISO, "depense", "charge"),
        priority: 83,
        jourISO,
      });
    }
    if (hasTre) {
      entries.push({
        id: `day:${jourISO}:tresorerie`,
        kind: "day",
        group: "Jours",
        title: `${label} — Trésorerie`,
        subtitle: "Voir les versements du jour",
        href: dayHref("tresorerie", jourISO),
        keywords: kw(label, jourISO, "tresorerie", "versement"),
        priority: 82,
        jourISO,
      });
    }
  }

  for (const p of data.productions) {
    if (p.statut !== "actif") continue;
    const jourISO = toIsoDate(new Date(p.jourISO));
    const alv = eggsToTrays(p.production, cap);
    entries.push({
      id: `production:${p.id}`,
      kind: "production",
      group: "Production",
      title: formatSearchDayLabel(jourISO),
      subtitle: `${alv} alv. ramassées · ${KPI_LABEL.stockFerme}`,
      href: dayHref("production", jourISO),
      keywords: kw(
        formatDay(new Date(p.jourISO)),
        jourISO,
        p.notes,
        p.production,
        p.envoyesVente,
        p.casses,
        "production",
        "ramasse",
        "oeuf",
        "alveole"
      ),
      priority: 60,
      jourISO,
    });
  }

  const clientDays = new Map<string, Set<string>>();
  for (const v of data.ventes) {
    if (v.statut !== "actif") continue;
    const client = (v.client ?? "").trim();
    if (!client) continue;
    const key = normalizeSearchText(client);
    const jourISO = toIsoDate(new Date(v.jourISO));
    if (!clientDays.has(key)) clientDays.set(key, new Set());
    clientDays.get(key)!.add(jourISO);
  }

  for (const v of data.ventes) {
    if (v.statut !== "actif") continue;
    const jourISO = toIsoDate(new Date(v.jourISO));
    const client = v.client?.trim() || "Client anonyme";
    entries.push({
      id: `vente:${v.id}`,
      kind: "vente",
      group: "Ventes",
      title: client,
      subtitle: `${formatSearchDayLabel(jourISO)} · ${formatGNF(v.montant)}`,
      href: moduleHref("/ventes", { jour: jourISO, q: client }),
      keywords: kw(
        client,
        formatDay(new Date(v.jourISO)),
        jourISO,
        v.montant,
        formatGNF(v.montant),
        v.prix,
        v.vendus,
        "vente",
        "client"
      ),
      priority: 70,
      jourISO,
    });
  }

  for (const [clientKey, days] of clientDays) {
    if (days.size < 2) continue;
    const sample = data.ventes.find(
      (v) => v.statut === "actif" && normalizeSearchText(v.client) === clientKey
    );
    const clientLabel = sample?.client?.trim() ?? clientKey;
    entries.push({
      id: `client:${clientKey}`,
      kind: "vente",
      group: "Clients",
      title: clientLabel,
      subtitle: `${days.size} jour(s) avec ventes`,
      href: moduleHref("/ventes", { q: clientLabel }),
      keywords: kw(clientLabel, "client", "vente", "acheteur"),
      priority: 72,
    });
  }

  for (const d of data.depenses) {
    if (d.statut !== "actif") continue;
    const jourISO = toIsoDate(new Date(d.jourISO));
    const cat = resolveCategorieLabel(
      d.categorie,
      data.config.listes.categoriesDepense
    );
    entries.push({
      id: `depense:${d.id}`,
      kind: "depense",
      group: "Dépenses",
      title: cat,
      subtitle: `${formatSearchDayLabel(jourISO)} · ${formatGNF(d.montant)}`,
      href: moduleHref("/depenses", { jour: jourISO, q: cat }),
      keywords: kw(
        cat,
        d.description,
        d.categorie,
        formatDay(new Date(d.jourISO)),
        jourISO,
        d.montant,
        formatGNF(d.montant),
        "depense",
        "charge"
      ),
      priority: 55,
      jourISO,
    });
  }

  for (const t of data.tresorerie) {
    if (t.statut !== "actif") continue;
    const jourISO = toIsoDate(new Date(t.jourISO));
    const methode = resolveMethodeLabel(
      t.methode,
      data.config.listes.methodesPaiement
    );
    entries.push({
      id: `tresorerie:${t.id}`,
      kind: "tresorerie",
      group: "Trésorerie",
      title: methode,
      subtitle: `${formatSearchDayLabel(jourISO)} · ${formatGNF(t.depose)} versé`,
      href: moduleHref("/tresorerie", { jour: jourISO, q: methode }),
      keywords: kw(
        methode,
        t.note,
        t.methode,
        formatDay(new Date(t.jourISO)),
        jourISO,
        t.depose,
        t.montantRecu,
        formatGNF(t.depose),
        formatGNF(t.montantRecu),
        "tresorerie",
        "versement",
        "orange",
        "espece"
      ),
      priority: 50,
      jourISO,
    });
  }

  for (const a of data.actions.slice(0, 200)) {
    entries.push({
      id: `historique:${a.id}`,
      kind: "historique",
      group: "Historique",
      title: a.description,
      subtitle: `${MODULE_LABEL[a.module]} · ${TYPE_LABEL[a.type]}`,
      href: moduleHref("/historique", { q: a.description.slice(0, 40) }),
      keywords: kw(
        a.description,
        MODULE_LABEL[a.module],
        TYPE_LABEL[a.type],
        getActionUserLabel(a),
        a.module,
        a.type,
        "historique",
        "action"
      ),
      priority: 40,
    });
  }

  return entries;
}
