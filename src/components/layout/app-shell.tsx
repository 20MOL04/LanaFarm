import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DateRangeProvider } from "@/contexts/date-range-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { UnsavedNavigationProvider } from "@/contexts/unsaved-navigation-context";

/**
 * AppShell : structure visuelle commune à tous les écrans connectés.
 *
 * Une seule sidebar pour tous les formats :
 *   - Mobile (<md)  : drawer overlay (déclenché par le burger Topbar)
 *   - Desktop (md+) : sidebar persistante, repliable
 *
 * Densifiée : padding x réduits, plus de barre de navigation mobile en bas.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <UnsavedNavigationProvider>
      <DateRangeProvider>
        <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-clip bg-background print:block print:bg-white print:min-h-0">
          <div className="print:hidden">
            <Sidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
            <div className="print:hidden">
              <Topbar />
            </div>
            <main className="flex-1 overflow-x-clip px-3 sm:px-4 lg:px-6 py-4 lg:py-5 print:px-0 print:py-0">
              <div className="page-stack mx-auto w-full max-w-[var(--content-max-width)] print:max-w-none">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DateRangeProvider>
      </UnsavedNavigationProvider>
    </SidebarProvider>
  );
}
