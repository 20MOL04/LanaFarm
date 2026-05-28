import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");

const replacements = [
  ["METHODES_DEPOTS", "METHODES_TRESORERIE"],
  ["MethodeDepot", "MethodeTresorerie"],
  ["aggregateDeposits", "aggregateTresorerie"],
  ["DepositsTotals", "TresorerieTotals"],
  ["useDepositsInRange", "useTresorerieInRange"],
  ["useDepositsStore", "useTresorerieStore"],
  ["getActiveDeposits", "getActiveTresorerie"],
  ["addDeposit", "addTresorerie"],
  ["updateDeposit", "updateTresorerie"],
  ["cancelDeposit", "cancelTresorerie"],
  ["restoreDeposit", "restoreTresorerie"],
  ["DepotDraftInput", "TresorerieDraftInput"],
  ["DepotPatch", "TresoreriePatch"],
  ["DepositFormErrors", "TresorerieFormErrors"],
  ["DepositDraft", "TresorerieDraft"],
  ["validateDepositDraft", "validateTresorerieDraft"],
  ["DepositsModule", "TresorerieModule"],
  ["DepositsTable", "TresorerieTable"],
  ["DepositsKpis", "TresorerieKpis"],
  ["DepositsRowActions", "TresorerieRowActions"],
  ["AddDepositDialog", "AddTresorerieDialog"],
  ["WeekStatusBannerDeposits", "WeekStatusBannerTresorerie"],
  ["DepositsStore", "TresorerieStore"],
  ["deposits-calc", "tresorerie-calc"],
  ["@/hooks/use-deposits-in-range", "@/hooks/use-tresorerie-in-range"],
  ["@/components/deposits/", "@/components/tresorerie/"],
  ["components/deposits/", "components/tresorerie/"],
  ["depotsInRange", "tresorerieInRange"],
  ["depositsState", "tresorerieState"],
  ['"/depots', '"/tresorerie'],
  ["depot/add", "tresorerie/add"],
  ["depot/update", "tresorerie/update"],
  ["depot/cancel", "tresorerie/cancel"],
  ["depot/restore", "tresorerie/restore"],
  ['createId("depot")', 'createId("tresorerie")'],
  ['module: "depot"', 'module: "tresorerie"'],
  ['| "depot"', '| "tresorerie"'],
  ["depots: Depot[]", "tresorerie: Tresorerie[]"],
  ["state.depots", "state.tresorerie"],
  ["depots.filter", "tresorerie.filter"],
  ["depots.push", "tresorerie.push"],
  ["depots.find", "tresorerie.find"],
  ["depots.map", "tresorerie.map"],
  ["depots:", "tresorerie:"],
  ["(depots)", "(tresorerie)"],
  ["{ depots }", "{ tresorerie }"],
  ["depots,", "tresorerie,"],
  ["depots }", "tresorerie }"],
  ["weekDepots", "weekTresorerie"],
  ["const depots =", "const tresorerie ="],
  ["type Depot", "type Tresorerie"],
  [": Depot", ": Tresorerie"],
  ["<Depot>", "<Tresorerie>"],
  ["Depot,", "Tresorerie,"],
  ["Depot }", "Tresorerie }"],
  ["Depot>", "Tresorerie>"],
  ["depot-pending", "tresorerie-pending"],
  ["depotsValides", "tresorerieValidee"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name !== "deposits" && name !== "node_modules") walk(p, files);
    } else if (/\.(tsx?|mjs)$/.test(name)) files.push(p);
  }
  return files;
}

for (const file of walk(root)) {
  if (file.includes(`${path.sep}deposits${path.sep}`)) continue;
  if (file.endsWith("deposits-calc.ts")) continue;
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== text) fs.writeFileSync(file, next);
}

console.log("Migration terminée.");
