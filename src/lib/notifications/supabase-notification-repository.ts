/**
 * Repository Supabase — stub branchable (branchement backend).
 * Les composants UI passent par farm-store + notification-storage.
 */

import type { AppNotification } from "@/types/notifications";

import type { NotificationRepository } from "./notification-repository";

export const supabaseNotificationRepository: NotificationRepository = {
  async load(_farmId) {
    // TODO Supabase : select * from farm_notifications where farm_id = …
    return [];
  },

  async upsertMany(_farmId, _items) {
    // TODO Supabase : upsert batch via notifications.service.ts
  },

  async markRead(_farmId, _id, _readAt) {
    // TODO Supabase : update read_at
  },

  async dismiss(_farmId, _id, _dismissedAt) {
    // TODO Supabase : update dismissed_at
  },
};
