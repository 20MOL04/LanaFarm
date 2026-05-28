/**
 * Service Notifications — requêtes Supabase (`farm_notifications`).
 *
 * SQL cible :
 *   select * from farm_notifications
 *   where farm_id = $1 and resolved_at is null
 *   order by created_at desc;
 *
 *   insert into farm_notifications (...) on conflict (farm_id, notification_key)
 *   where resolved_at is null do update ...;
 *
 * Branchement : activer getNotificationRepository() via
 * NEXT_PUBLIC_NOTIFICATIONS_REMOTE=true
 */

import type { AppNotification } from "@/types/notifications";
import type { FarmNotificationRow } from "@/types/supabase-schema";

export type NotificationSubscribeCallback = (items: AppNotification[]) => void;

/** Charge toutes les notifications actives d'une ferme. */
export async function fetchNotifications(
  _farmId: string
): Promise<FarmNotificationRow[]> {
  // TODO : supabase.from('farm_notifications').select().eq('farm_id', farmId)
  return [];
}

/** Upsert batch (sync règles métier). */
export async function upsertNotifications(
  _farmId: string,
  _rows: FarmNotificationRow[]
): Promise<void> {
  // TODO : upsert via supabase client
}

/** Marque une notification comme lue. */
export async function markNotificationRead(
  _farmId: string,
  _id: string,
  _readAt: string
): Promise<void> {
  // TODO : update read_at
}

/** Realtime multi-appareil (optionnel post-Vercel). */
export function subscribeNotifications(
  _farmId: string,
  _callback: NotificationSubscribeCallback
): () => void {
  // TODO : supabase.channel('farm_notifications').on('postgres_changes', ...)
  return () => {};
}
