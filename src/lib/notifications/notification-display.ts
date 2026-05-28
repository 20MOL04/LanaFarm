import { formatGNF } from "@/lib/format";
import type { AppNotification } from "@/types/notifications";

/**
 * Texte affiché — montants en GNF complets (jamais K/M).
 * Gère aussi les notifs déjà persistées en format compact.
 */
export function notificationDisplayDescription(n: AppNotification): string {
  return expandCompactGnfInText(n.description);
}

/** Ligne montant mise en avant (trésorerie) + libellé secondaire. */
export function notificationDetailContent(n: AppNotification): {
  amountLine: string | null;
  body: string;
} {
  const body = expandCompactGnfInText(n.description);
  if (n.meta?.montantGNF != null && Number.isFinite(n.meta.montantGNF)) {
    const amountLine = formatGNF(n.meta.montantGNF);
    const afterDash = body.includes("—") ? body.split("—").slice(1).join("—").trim() : "";
    return {
      amountLine,
      body: afterDash || body.replace(amountLine, "").trim() || body,
    };
  }
  return { amountLine: null, body };
}

function expandCompactGnfInText(text: string): string {
  return text.replace(
    /([\d]+(?:[.,]\d+)?)\s*([kKmM])\s*GNF/g,
    (_match, num: string, suffix: string) => {
      const base = parseFloat(num.replace(",", "."));
      if (!Number.isFinite(base)) return _match;
      const mult =
        suffix.toLowerCase() === "m"
          ? 1_000_000
          : suffix.toLowerCase() === "k"
            ? 1_000
            : 1;
      return formatGNF(Math.round(base * mult));
    }
  );
}
