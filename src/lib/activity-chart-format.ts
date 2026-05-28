import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { ActivityMetricKey } from "@/lib/dashboard-calc";
import { formatGNF, formatNumber } from "@/lib/format";

/** Date courte pour infobulle (distincte du tick axe « d MMM »). */
export function formatActivityTooltipDate(dateISO: string): string {
  const raw = format(new Date(dateISO), "EEE d MMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Valeur lisible au survol — montants GNF complets, alvéoles entières. */
export function formatActivityTooltipValue(
  metric: ActivityMetricKey,
  value: number
): string {
  if (metric === "production") {
    return `${formatNumber(value)} alvéoles`;
  }
  return formatGNF(value);
}
