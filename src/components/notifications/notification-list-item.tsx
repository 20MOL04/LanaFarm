"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { NotificationReadBadge } from "@/components/notifications/notification-read-badge";
import { notificationDisplayDescription } from "@/lib/notifications/notification-display";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";
import { isUnread } from "@/types/notifications";

const LEVEL_DOT: Record<AppNotification["level"], string> = {
  critical: "bg-danger",
  important: "bg-warning",
  normal: "bg-info",
  positive: "bg-success",
};

type Props = {
  notification: AppNotification;
  onSelect: (n: AppNotification) => void;
};

export function NotificationListItem({ notification, onSelect }: Props) {
  const unread = isUnread(notification);
  const when = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });
  const description = notificationDisplayDescription(notification);

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "flex w-full items-start gap-1.5 px-1.5 py-1 text-left transition-colors hover:bg-muted/40",
        unread && "bg-accent-blue-soft/20"
      )}
      aria-label={`${notification.title}, ${unread ? "non lue" : "lue"}`}
    >
      <span
        className={cn(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          LEVEL_DOT[notification.level],
          unread && "ring-1 ring-accent-blue/40"
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-1.5">
          <span
            className={cn(
              "truncate text-[12px] leading-tight text-foreground",
              unread ? "font-medium" : "font-normal text-muted"
            )}
          >
            {notification.title}
          </span>
          <NotificationReadBadge unread={unread} />
        </span>
        <span className="mt-px block truncate text-[10px] leading-tight text-muted">
          {description}
          <span className="text-muted/80"> · {when}</span>
        </span>
      </span>
    </button>
  );
}
