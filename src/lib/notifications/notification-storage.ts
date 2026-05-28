import { localNotificationRepository } from "./local-notification-repository";
import type { NotificationRepository } from "./notification-repository";
import { supabaseNotificationRepository } from "./supabase-notification-repository";

/**
 * Sélecteur de persistance — localStorage par défaut V1.
 * Activer Supabase via NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_NOTIFICATIONS_REMOTE=true
 */
export function getNotificationRepository(): NotificationRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const remote = process.env.NEXT_PUBLIC_NOTIFICATIONS_REMOTE === "true";
  if (url && remote) {
    return supabaseNotificationRepository;
  }
  return localNotificationRepository;
}
