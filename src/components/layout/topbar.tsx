"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { GlobalDateRange } from "@/components/calendar/global-date-range";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  GlobalSearchIconButton,
  GlobalSearchTrigger,
} from "@/components/search/global-search-provider";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

/**
 * Topbar minimaliste : burger (mobile) + recherche globale + calendrier + actions.
 */
export function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "h-[var(--topbar-height)] w-full",
        "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75",
        "border-b border-border"
      )}
    >
      <div className="flex h-full min-w-0 items-center gap-2 overflow-hidden px-3 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Ouvrir le menu"
          onClick={openMobile}
          className="md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <GlobalSearchIconButton className="sm:hidden" />
        <GlobalSearchTrigger />

        <div className="ml-auto flex min-w-0 shrink items-center gap-1.5">
          <GlobalDateRange />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
