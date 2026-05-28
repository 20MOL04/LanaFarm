import "server-only";

import { appNotificationToRow, rowToAppNotification } from "@/lib/notifications/notification-mapper";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AppNotification } from "@/types/notifications";

export async function loadNotifications(farmId: string): Promise<AppNotification[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("farm_notifications")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToAppNotification);
}

export async function upsertNotifications(
  farmId: string,
  items: AppNotification[]
): Promise<void> {
  if (items.length === 0) return;
  const rows = items.map((n) => ({
    ...appNotificationToRow({ ...n, farm_id: farmId }),
    farm_id: farmId,
  }));
  const { error } = await getSupabaseAdmin()
    .from("farm_notifications")
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function patchNotification(
  farmId: string,
  id: string,
  patch: { read_at?: string | null; dismissed_at?: string | null }
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("farm_notifications")
    .update(patch)
    .eq("farm_id", farmId)
    .eq("id", id);
  if (error) throw error;
}
