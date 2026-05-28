import type { AppNotification } from "@/types/notifications";

import type { NotificationRepository } from "./notification-repository";

const STORAGE_KEY = "lanafarm-notifications-v1";

type StoredPayload = {
  farmId: string;
  items: AppNotification[];
};

function readAll(): StoredPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(payloads: StoredPayload[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payloads));
}

export const localNotificationRepository: NotificationRepository = {
  async load(farmId) {
    const all = readAll();
    return all.find((p) => p.farmId === farmId)?.items ?? [];
  },

  async upsertMany(farmId, items) {
    const all = readAll().filter((p) => p.farmId !== farmId);
    all.push({ farmId, items });
    writeAll(all);
  },

  async markRead(farmId, id, readAt) {
    const items = await localNotificationRepository.load(farmId);
    const next = items.map((n) =>
      n.id === id ? { ...n, readAt } : n
    );
    await localNotificationRepository.upsertMany(farmId, next);
  },

  async dismiss(farmId, id, dismissedAt) {
    const items = await localNotificationRepository.load(farmId);
    const next = items.map((n) =>
      n.id === id ? { ...n, dismissedAt } : n
    );
    await localNotificationRepository.upsertMany(farmId, next);
  },
};
