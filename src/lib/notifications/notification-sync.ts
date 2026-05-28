import { createId } from "@/lib/ids";
import type { AppNotification, NotificationDraft } from "@/types/notifications";
import { DEFAULT_FARM_ID } from "@/types/notifications";

function sortByCreatedAtDesc(items: AppNotification[]): AppNotification[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fusionne les brouillons actifs avec l'état persisté (dédup par `key`).
 */
export function mergeNotificationSync(
  existing: AppNotification[],
  drafts: NotificationDraft[],
  nowISO: string,
  farmId: string = DEFAULT_FARM_ID
): AppNotification[] {
  const draftKeys = new Set(drafts.map((d) => d.key));
  const activeExisting = existing.filter((n) => !n.resolvedAt);
  const byKey = new Map(activeExisting.map((n) => [n.key, n]));
  const next: AppNotification[] = [];

  for (const draft of drafts) {
    const prev = byKey.get(draft.key);
    if (prev) {
      next.push({
        ...prev,
        level: draft.level,
        module: draft.module,
        title: draft.title,
        description: draft.description,
        href: draft.href,
        query: draft.query,
        meta: draft.meta,
      });
      byKey.delete(draft.key);
    } else {
      next.push({
        id: createId(),
        farm_id: farmId,
        key: draft.key,
        level: draft.level,
        module: draft.module,
        title: draft.title,
        description: draft.description,
        href: draft.href,
        query: draft.query,
        meta: draft.meta,
        createdAt: nowISO,
      });
    }
  }

  for (const prev of byKey.values()) {
    if (!prev.dismissedAt) {
      next.push({ ...prev, resolvedAt: nowISO });
    }
  }

  const archived = existing.filter((n) => n.resolvedAt || n.dismissedAt);
  const archivedKeys = new Set(archived.map((n) => `${n.key}:${n.resolvedAt ?? n.dismissedAt}`));
  const mergedArchived = [
    ...archived,
    ...next.filter((n) => n.resolvedAt).filter(
      (n) => !archivedKeys.has(`${n.key}:${n.resolvedAt}`)
    ),
  ];

  const active = next.filter((n) => !n.resolvedAt);
  return sortByCreatedAtDesc([...active, ...mergedArchived.slice(0, 50)]);
}

export function countUnreadNotifications(items: AppNotification[]): number {
  return items.filter((n) => !n.readAt && !n.dismissedAt && !n.resolvedAt).length;
}

/** Alertes critical / important — sous-ensemble de l’onglet Récentes. */
export function filterImportantTab(items: AppNotification[]): AppNotification[] {
  return sortByCreatedAtDesc(
    items.filter(
      (n) =>
        (n.level === "critical" || n.level === "important") &&
        !n.dismissedAt &&
        !n.resolvedAt
    )
  );
}

/** Toutes les notifications actives, tous niveaux. */
export function filterRecentTab(items: AppNotification[]): AppNotification[] {
  return sortByCreatedAtDesc(
    items.filter((n) => !n.dismissedAt && !n.resolvedAt)
  );
}
