"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationsStore } from "@/contexts/farm-store";
import { countUnreadNotifications } from "@/lib/notifications/notification-sync";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

export function NotificationBell({
  variant = "default",
}: {
  variant?: "default" | "topbar";
}) {
  const { notifications, markRead } = useNotificationsStore();
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AppNotification | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const unread = countUnreadNotifications(notifications);
  const badge =
    unread <= 0 ? null : unread >= 100 ? "99+" : String(unread);

  const handleSelect = (n: AppNotification) => {
    const readAt = new Date().toISOString();
    markRead(n.id);
    setDetail({ ...n, readAt: n.readAt ?? readAt });
    setDetailOpen(true);
    setOpen(false);
  };

  const onTopbar = variant === "topbar";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size={onTopbar ? "icon" : "icon-sm"}
            aria-label={
              unread > 0
                ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}`
                : "Notifications"
            }
            className={cn(
              "relative",
              onTopbar && "text-white hover:bg-white/15 hover:text-white"
            )}
          >
            <Bell className={onTopbar ? "h-5 w-5" : "h-4 w-4"} />
            {badge ? (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center",
                  "rounded-full bg-danger px-0.5 text-caption font-semibold leading-none text-white"
                )}
              >
                {badge}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 rounded-card border-border p-0 shadow-modal"
        >
          <NotificationPanel
            notifications={notifications}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>

      <NotificationDetailDialog
        notification={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRead={markRead}
      />
    </>
  );
}
