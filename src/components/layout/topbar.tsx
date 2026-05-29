"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { GlobalDateRange } from "@/components/calendar/global-date-range";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearchTrigger } from "@/components/search/global-search-provider";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

/**
 * Topbar : barre blanche — burger (mobile) + recherche + calendrier + cloche.
 */
export function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "h-[var(--topbar-height)] w-full",
        "bg-card text-foreground",
        "border-b border-border-strong/60",
        "shadow-[0_1px_2px_rgb(15_23_42/0.06),0_4px_14px_-2px_rgb(15_23_42/0.10)]"
      )}
    >
      <div className="flex h-full min-w-0 items-center gap-2 overflow-hidden px-3 sm:gap-3 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          onClick={openMobile}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <GlobalSearchTrigger mobile />
        <GlobalSearchTrigger />

        <div className="ml-auto flex min-w-0 shrink items-center gap-2">
          <GlobalDateRange />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
