import { isFarmDataRemote } from "@/lib/farm-id";

import { apiNotificationRepository } from "./api-notification-repository";
import { localNotificationRepository } from "./local-notification-repository";
import type { NotificationRepository } from "./notification-repository";

/**
 * Persistance notifications — localStorage (dev) ou API Supabase (prod papa).
 */
export function getNotificationRepository(): NotificationRepository {
  if (isFarmDataRemote()) {
    return apiNotificationRepository;
  }
  return localNotificationRepository;
}
