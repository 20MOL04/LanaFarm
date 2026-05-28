"use client";

import * as React from "react";

const STORAGE_KEY = "lanafarm:sidebar-collapsed";

type SidebarContextValue = {
  /** Desktop : sidebar repliée en mode icônes-only. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile : drawer ouvert par-dessus le contenu. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Hydrate l'état desktop depuis localStorage.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      // localStorage indisponible — on garde le défaut.
    }
  }, []);

  // Persiste à chaque changement.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Ferme automatiquement le drawer mobile au changement de route
  // (le clic sur un lien ne suffit pas seul à fermer un overlay).
  // → géré côté liens (closeMobile au click) — voir Sidebar.

  // Echap pour fermer le drawer mobile.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Bloque le scroll du body quand le drawer est ouvert.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((v) => !v),
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
    }),
    [collapsed, mobileOpen]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("SidebarProvider manquant dans l'arbre React.");
  }
  return ctx;
}
