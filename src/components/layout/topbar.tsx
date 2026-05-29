"use client";

import * as React from "react";
import { Menu, Search } from "lucide-react";

import { GlobalDateRange } from "@/components/calendar/global-date-range";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

/**
 * Topbar minimaliste : burger (mobile) + recherche + calendrier + actions.
 * Densifiée : 56 px de hauteur, padding réduit, action "Nouvelle saisie"
 * compactée en icône sous lg.
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
        {/* Burger mobile */}
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

        <SearchField />

        <div className="ml-auto flex min-w-0 shrink items-center gap-1.5">
          <GlobalDateRange />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

function SearchField() {
  return (
    <div className="relative hidden flex-1 sm:block sm:max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <Input
        type="search"
        placeholder="Rechercher…"
        aria-label="Rechercher"
        className="h-9 bg-card pl-8 text-base md:text-body-sm"
      />
    </div>
  );
}
