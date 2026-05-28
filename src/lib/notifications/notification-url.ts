import type { AppNotification } from "@/types/notifications";

/** Construit l'URL de navigation (href + query). */
export function buildNotificationHref(n: AppNotification): string {
  if (!n.query || Object.keys(n.query).length === 0) return n.href;
  const params = new URLSearchParams(n.query);
  return `${n.href}?${params.toString()}`;
}
