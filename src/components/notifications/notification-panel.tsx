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
    <div className="flex w-64 flex-col">
      <div className="flex border-b border-border">
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
              "flex flex-1 items-center justify-center gap-1 px-1.5 py-1.5 text-[11px] font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            <span>{t.label}</span>
            <span className="tabular-nums text-[10px] font-normal text-muted">
              ({t.count}
              {t.unread > 0 ? (
                <span className="text-accent-blue"> · {t.unread}</span>
              ) : null}
              )
            </span>
          </button>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto py-0.5">
        {visible.length === 0 ? (
          <EmptyState
            title={
              tab === "recent"
                ? "Aucune notification récente."
                : "Aucune alerte importante."
            }
            className="py-6"
          />
        ) : (
          <ul role="list" className="divide-y divide-border/60">
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
