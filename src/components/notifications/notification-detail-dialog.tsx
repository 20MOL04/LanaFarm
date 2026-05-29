"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationReadBadge } from "@/components/notifications/notification-read-badge";
import { notificationDetailContent } from "@/lib/notifications/notification-display";
import { buildNotificationHref } from "@/lib/notifications/notification-url";
import type { AppNotification } from "@/types/notifications";
import { isUnread } from "@/types/notifications";

type Props = {
  notification: AppNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRead: (id: string) => void;
};

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onRead,
}: Props) {
  const router = useRouter();

  if (!notification) return null;

  const whenFull = format(new Date(notification.createdAt), "PPP 'à' HH:mm", {
    locale: fr,
  });
  const targetHref = buildNotificationHref(notification);
  const seuilHref = "/parametres?section=seuils";
  const { amountLine, body } = notificationDetailContent(notification);
  const unread = isUnread(notification);

  const handleVoir = () => {
    onRead(notification.id);
    onOpenChange(false);
    router.push(targetHref);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && notification) onRead(notification.id);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-base leading-snug">{notification.title}</DialogTitle>
            <NotificationReadBadge unread={unread} className="pt-0.5" />
          </div>
        </DialogHeader>
        <DialogBody className="space-y-2 text-sm text-muted">
          {amountLine ? (
            <p className="font-medium tabular-nums text-foreground">{amountLine}</p>
          ) : null}
          <p className="tabular-nums leading-relaxed">{body}</p>
          <p className="text-label">{whenFull}</p>
        </DialogBody>
        <DialogFooter>
          {notification.meta?.seuilKey ? (
            <Button asChild variant="outline" size="sm">
              <Link href={seuilHref} onClick={() => onRead(notification.id)}>
                Ajuster le seuil
              </Link>
            </Button>
          ) : null}
          <Button type="button" variant="accent" size="sm" onClick={handleVoir}>
            Voir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
