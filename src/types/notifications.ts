/**
 * Modèle domaine — centre de notifications (cloche).
 * Miroir cible : table `farm_notifications` (Supabase).
 */

export type NotificationLevel = "critical" | "important" | "normal" | "positive";

export type NotificationTab = "important" | "recent";

export type NotificationModule =
  | "production"
  | "ventes"
  | "depenses"
  | "tresorerie"
  | "transferts"
  | "rapports"
  | "parametres"
  | "system";

export type NotificationSeuilKey =
  | "stockMagasinFaiblePlateaux"
  | "tresorerieEnAttenteMaxGNF"
  | "pertesHebdoMaxPct";

export type AppNotificationMeta = {
  seuilKey?: NotificationSeuilKey;
  entityId?: string;
  jourISO?: string;
  /** Montant affiché en GNF complet (détail + liste). */
  montantGNF?: number;
};

export type AppNotification = {
  id: string;
  farm_id: string;
  key: string;
  level: NotificationLevel;
  module: NotificationModule;
  title: string;
  description: string;
  href: string;
  query?: Record<string, string>;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  resolvedAt?: string;
  meta?: AppNotificationMeta;
};

/** Brouillon émis par les règles métier (avant persistance / dédup par `key`). */
export type NotificationDraft = Omit<
  AppNotification,
  "id" | "farm_id" | "createdAt" | "readAt" | "dismissedAt" | "resolvedAt"
>;

export function notificationTab(n: AppNotification): NotificationTab {
  return n.level === "critical" || n.level === "important" ? "important" : "recent";
}

export function isUnread(n: AppNotification): boolean {
  return !n.readAt && !n.dismissedAt && !n.resolvedAt;
}

export function isActiveNotification(n: AppNotification): boolean {
  return !n.dismissedAt && !n.resolvedAt;
}

export const DEFAULT_FARM_ID = "local-farm-v1";
