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
  variant?: "default" | "topbar";
};

export function GlobalSearchTrigger({
  className,
  mobile = false,
  variant = "default",
}: TriggerProps) {
  const { setOpen } = useGlobalSearchDialog();
  const onTopbar = variant === "topbar";

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "relative flex min-w-0 items-center rounded-input border text-left transition-colors",
        mobile
          ? "h-10 flex-1 sm:hidden"
          : "hidden h-9 sm:flex sm:max-w-sm sm:flex-1",
        onTopbar
          ? "border-white/35 bg-white/15 text-white hover:bg-white/20"
          : "border-border bg-card",
        className
      )}
      aria-label="Ouvrir la recherche globale"
    >
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
          mobile ? "left-3 h-5 w-5" : "left-2.5 h-4 w-4",
          onTopbar && "text-white/90"
        )}
      />
      <span
        className={cn(
          "truncate pr-3 font-medium",
          mobile ? "pl-10 text-body-sm" : "pl-8 text-body-sm",
          onTopbar ? "text-white/95" : "text-muted-foreground"
        )}
      >
        {mobile ? "Rechercher…" : "Client, jour, montant…"}
      </span>
      {!mobile ? (
        <kbd
          className={cn(
            "pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-sm border px-1.5 py-0.5 text-micro md:inline",
            onTopbar
              ? "border-white/30 bg-white/10 text-white/85"
              : "border-border bg-card-muted text-muted"
          )}
        >
          Ctrl K
        </kbd>
      ) : null}
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
