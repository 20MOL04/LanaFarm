"use client";

import * as React from "react";

import { NotificationListItem } from "@/components/notifications/notification-list-item";
import { EmptyState } from "@/components/shared/empty-state";
import {
  countUnreadNotifications,
  filterImportantTab,
  filterRecentTab,
} from "@/lib/notifications/notification-sync";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

type TabId = "recent" | "important";

type Props = {
  notifications: AppNotification[];
  onSelect: (n: AppNotification) => void;
};

export function NotificationPanel({ notifications, onSelect }: Props) {
  const [tab, setTab] = React.useState<TabId>("recent");

  const important = React.useMemo(
    () => filterImportantTab(notifications),
    [notifications]
  );
  const recent = React.useMemo(
    () => filterRecentTab(notifications),
    [notifications]
  );
  const visible = tab === "recent" ? recent : important;
  const unreadRecent = countUnreadNotifications(recent);
  const unreadImportant = countUnreadNotifications(important);

  return (
    <div className="flex w-80 flex-col">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
      </header>

      <div className="flex gap-1 border-b border-border px-4 py-2">
        {(
          [
            {
              id: "recent" as const,
              label: "Récentes",
              count: recent.length,
              unread: unreadRecent,
            },
            {
              id: "important" as const,
              label: "Importantes",
              count: important.length,
              unread: unreadImportant,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-label font-medium transition-colors",
              tab === t.id
                ? "bg-card-muted text-foreground"
                : "text-muted hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <span>{t.label}</span>
            <span className="tabular-nums text-label text-muted">
              ({t.count}
              {t.unread > 0 ? (
                <span className="text-accent-blue"> · {t.unread}</span>
              ) : null}
              )
            </span>
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto px-2 py-2">
        {visible.length === 0 ? (
          <EmptyState
            title={
              tab === "recent"
                ? "Aucune notification récente."
                : "Aucune alerte importante."
            }
            className="py-8"
          />
        ) : (
          <ul role="list" className="flex flex-col gap-1">
            {visible.map((n) => (
              <li key={n.id}>
                <NotificationListItem notification={n} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
