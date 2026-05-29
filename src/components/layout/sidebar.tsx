"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsRight, X } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { SidebarLogoutButton } from "@/components/layout/sidebar-logout-button";
import { navigation, assistanceNavigation, type NavItem, type NavGroup } from "@/config/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { useUnsavedNavigation } from "@/contexts/unsaved-navigation-context";
import { cn } from "@/lib/utils";

/**
 * Sidebar bleue brand — 3 états :
 *   - Desktop (md+) : sidebar persistante, expanded (232 px) ou collapsed (64 px)
 *   - Mobile (<md)  : drawer overlay déclenché depuis le burger de la Topbar
 *
 * Une seule implémentation pour les 3 cas — pas de duplication, pas de
 * MobileNav séparée.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebar();
  /** Sur mobile drawer : toujours menu déplié (libellés visibles). */
  const menuCollapsed = collapsed && !mobileOpen;

  return (
    <>
      {/* --- Mobile : backdrop --- */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden",
          "transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-label="Navigation principale"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex max-h-[100dvh] flex-col",
          "bg-sidebar text-sidebar-foreground shadow-sidebar",
          "border-0 outline-none",
          "transition-[width,transform] duration-200 ease-out",
          "w-[min(300px,88vw)] -translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
          "md:sticky md:top-0 md:max-h-screen md:h-screen",
          collapsed ? "md:w-[var(--sidebar-width-collapsed)]" : "md:w-[var(--sidebar-width)]"
        )}
      >
        <SidebarHeader
          collapsed={menuCollapsed}
          onCloseMobile={closeMobile}
          onToggleCollapsed={toggleCollapsed}
        />
        <SidebarMenu
          pathname={pathname}
          collapsed={menuCollapsed}
          onNavigate={closeMobile}
        />
        <SidebarLogoutButton collapsed={menuCollapsed} />
      </aside>
    </>
  );
}

/* ===========================================================
   Header / brand
   =========================================================== */

function SidebarHeader({
  collapsed,
  onCloseMobile,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 border-0",
        "h-[var(--topbar-height)]",
        collapsed
          ? "flex-col items-center justify-center gap-0.5 px-1 md:gap-1"
          : "items-center gap-2 px-4 md:px-2"
      )}
    >
      {!collapsed ? (
        <>
          <div className="flex min-w-0 flex-1 items-center text-white">
            <BrandLogo
              showWordmark
              className="items-center [&_span:last-child]:text-white"
            />
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Replier le menu"
            title="Replier"
            className={cn(
              "relative z-10 hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm md:flex",
              "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
            )}
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Déplier le menu"
            title="Déplier"
            className={cn(
              "relative hidden flex-col items-center justify-center gap-0.5 rounded-sm p-1 md:flex",
              "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
            )}
          >
            <BrandLogo size="xs" />
            <ChevronsRight className="h-3.5 w-3.5 shrink-0" />
          </button>
          <BrandLogo size="sm" className="md:hidden" />
        </>
      )}
      <button
        type="button"
        onClick={onCloseMobile}
        aria-label="Fermer le menu"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
          "text-sidebar-muted hover:bg-sidebar-hover hover:text-white",
          "md:hidden",
          collapsed && "md:hidden"
        )}
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}

/* ===========================================================
   Menu — espacement confortable, répartition verticale
   =========================================================== */

function SidebarMenu({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const groups: NavGroup[] = [...navigation, assistanceNavigation];

  return (
    <nav
      aria-label="Navigation"
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-2.5",
        "md:px-2 md:py-2",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      <SidebarNavGroups
        groups={groups}
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

function SidebarNavGroups({
  groups,
  pathname,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <ul className={cn("flex flex-col", collapsed && "gap-2")}>
      {groups.map((group, index) => {
        const isAssistance = group.title === "Assistance";

        return (
          <li
            key={group.title}
            className={cn(
              !collapsed &&
                index > 0 &&
                (isAssistance
                  ? "mt-5 border-t border-sidebar-border pt-3 md:mt-4 md:border-sidebar-border/50 md:pt-2.5"
                  : "mt-5 md:mt-4")
            )}
          >
            {!collapsed ? (
              <p
                className={cn(
                  "px-1 pb-0.5 text-sm font-semibold uppercase tracking-wide text-sidebar-muted/90",
                  "md:px-2 md:pb-0 md:text-micro md:text-sidebar-muted"
                )}
              >
                {group.title}
              </p>
            ) : index > 0 ? (
              <div className="mx-2 my-1.5 h-px bg-sidebar-border/80" />
            ) : null}
            <ul className="space-y-0">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onClick={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  const router = useRouter();
  const { guardNavigation } = useUnsavedNavigation();
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(`${item.href}/`));
  const Icon = item.icon;

  React.useEffect(() => {
    router.prefetch(item.href);
  }, [router, item.href]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (isActive) {
        onClick();
        return;
      }

      event.preventDefault();
      guardNavigation(() => {
        router.push(item.href);
        onClick();
      });
    },
    [guardNavigation, isActive, item.href, onClick, router]
  );

  return (
    <Link
      href={item.href}
      prefetch
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex min-h-[2.75rem] items-center gap-3 rounded-md px-3 py-2",
        "text-lg font-semibold leading-tight",
        "md:min-h-0 md:gap-2.5 md:rounded-sm md:px-2 md:py-[0.4375rem] md:text-nav md:font-medium",
        "transition-colors",
        collapsed ? "justify-center md:justify-center" : "justify-start",
        isActive
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
      )}
    >
      <Icon className="h-6 w-6 shrink-0 md:h-4 md:w-4" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

