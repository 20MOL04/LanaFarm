import type { AppNotification } from "@/types/notifications";

import type { NotificationRepository } from "./notification-repository";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API notifications ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiNotificationRepository: NotificationRepository = {
  async load(_farmId) {
    const data = await parseJson<{ items: AppNotification[] }>(
      await fetch("/api/farm/notifications", { credentials: "include" })
    );
    return data.items ?? [];
  },

  async upsertMany(_farmId, items) {
    await parseJson(
      await fetch("/api/farm/notifications", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
    );
  },

  async markRead(_farmId, id, readAt) {
    await parseJson(
      await fetch("/api/farm/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, readAt }),
      })
    );
  },

  async dismiss(_farmId, id, dismissedAt) {
    await parseJson(
      await fetch("/api/farm/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dismissedAt }),
      })
    );
  },
};
