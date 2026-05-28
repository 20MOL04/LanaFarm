/**
 * Données de démonstration pour le squelette V1.
 * Seront remplacées par les requêtes Supabase dans une prochaine étape.
 */

import { addDays, startOfDay, subDays } from "date-fns";

import type { DashboardKpis } from "@/types/domain";

export function buildDemoKpis(): DashboardKpis {
  return {
    stockFerme: 4_280,
    stockVente: 1_640,
    totalVentes: 18_450_000,
    totalDepenses: 7_320_000,
    pertesTotales: 142,
    tresorerieValidee: 12_400_000,
    montantEnAttente: 6_050_000,
    beneficeEstime: 11_130_000,
  };
}

export function buildDemoActivitySeries(days = 14) {
  const today = startOfDay(new Date());
  const start = subDays(today, days - 1);

  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const isWeekend = [0, 6].includes(date.getDay());

    const productionBase = 540 + Math.round(Math.sin(i / 2) * 40);
    const production = Math.max(420, productionBase + (isWeekend ? -60 : 30));
    const ca = 1_650_000 + Math.round(Math.cos(i / 3) * 250_000) + i * 8_500;
    const depenses = 620_000 + Math.round(Math.sin(i / 3) * 90_000);
    const profit = ca - depenses;

    return {
      dateISO: date.toISOString(),
      production,
      ca,
      depenses,
      profit,
    };
  });
}
