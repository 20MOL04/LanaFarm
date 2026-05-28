import type { AppNotification } from "@/types/notifications";

export interface NotificationRepository {
  load(farmId: string): Promise<AppNotification[]>;
  upsertMany(farmId: string, items: AppNotification[]): Promise<void>;
  markRead(farmId: string, id: string, readAt: string): Promise<void>;
  dismiss(farmId: string, id: string, dismissedAt: string): Promise<void>;
}
