"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { GlobalSearchDialog } from "@/components/search/global-search-dialog";
import { cn } from "@/lib/utils";

type GlobalSearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const GlobalSearchContext = React.createContext<GlobalSearchContextValue | null>(
  null
);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = React.useMemo(() => ({ open, setOpen }), [open]);

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearchDialog(): GlobalSearchContextValue {
  const ctx = React.useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error("GlobalSearchProvider manquant dans l'arbre React.");
  }
  return ctx;
}

type TriggerProps = {
  className?: string;
  mobile?: boolean;
};

export function GlobalSearchTrigger({ className, mobile = false }: TriggerProps) {
  const { setOpen } = useGlobalSearchDialog();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "relative flex h-9 w-full min-w-0 items-center rounded-input border border-border bg-card text-left",
        mobile ? "flex sm:hidden" : "hidden sm:flex sm:max-w-sm sm:flex-1",
        className
      )}
      aria-label="Ouvrir la recherche globale"
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <span className="truncate pl-8 pr-3 text-body-sm text-muted-foreground">
        Client, jour, montant…
      </span>
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-sm border border-border bg-card-muted px-1.5 py-0.5 text-micro text-muted md:inline">
        Ctrl K
      </kbd>
    </button>
  );
}

export function GlobalSearchIconButton({ className }: { className?: string }) {
  const { setOpen } = useGlobalSearchDialog();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Rechercher"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-button text-muted hover:bg-card-muted hover:text-foreground",
        className
      )}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
