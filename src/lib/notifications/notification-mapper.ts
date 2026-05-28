/**
 * Mapping domaine ↔ ligne Postgres `farm_notifications`.
 */

import type { AppNotification } from "@/types/notifications";
import type { FarmNotificationRow } from "@/types/supabase-schema";

export function appNotificationToRow(n: AppNotification): FarmNotificationRow {
  return {
    id: n.id,
    farm_id: n.farm_id,
    notification_key: n.key,
    level: n.level,
    module: n.module,
    title: n.title,
    description: n.description,
    href: n.href,
    query_json: n.query ?? null,
    meta_json: n.meta ?? null,
    created_at: n.createdAt,
    read_at: n.readAt ?? null,
    dismissed_at: n.dismissedAt ?? null,
    resolved_at: n.resolvedAt ?? null,
  };
}

export function rowToAppNotification(row: FarmNotificationRow): AppNotification {
  return {
    id: row.id,
    farm_id: row.farm_id,
    key: row.notification_key,
    level: row.level as AppNotification["level"],
    module: row.module as AppNotification["module"],
    title: row.title,
    description: row.description,
    href: row.href,
    query: row.query_json ?? undefined,
    meta: (row.meta_json as AppNotification["meta"]) ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
    dismissedAt: row.dismissed_at ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
  };
}
