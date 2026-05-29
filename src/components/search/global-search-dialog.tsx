"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/use-global-search";
import type { GlobalSearchEntry } from "@/lib/global-search";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const result = useGlobalSearch(query);
  const flatEntries = React.useMemo(
    () => result.groups.flatMap((g) => g.entries),
    [result.groups]
  );

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const navigate = React.useCallback(
    (entry: GlobalSearchEntry) => {
      onOpenChange(false);
      router.push(entry.href);
    },
    [onOpenChange, router]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatEntries.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && flatEntries[activeIndex]) {
      event.preventDefault();
      navigate(flatEntries[activeIndex]);
    } else if (event.key === "Escape") {
      onOpenChange(false);
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85dvh,640px)] w-[min(100vw-1rem,32rem)] max-w-none flex-col gap-0 p-0"
        onKeyDown={onKeyDown}
      >
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">Recherche globale</DialogTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Client, jour, montant, dépense…"
              aria-label="Recherche globale"
              className="h-10 border-0 bg-card-muted/50 pl-9 shadow-none focus-visible:ring-0"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="mt-1.5 text-caption text-muted">
            Production · Ventes · Dépenses · Trésorerie · Historique
          </p>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 overflow-hidden p-0">
          <div ref={listRef} className="max-h-[min(60dvh,480px)] overflow-y-auto overscroll-contain py-2">
            {flatEntries.length === 0 ? (
              <p className="px-4 py-8 text-center text-label text-muted">
                {query.trim()
                  ? "Aucun résultat. Essayez un client, une date ou un montant."
                  : "Tapez pour chercher ou choisissez une action rapide."}
              </p>
            ) : (
              result.groups.map((group) => (
                <section key={group.id} className="px-2 pb-2">
                  <p className="px-2 pb-1 pt-1 text-caption font-semibold uppercase tracking-wide text-muted">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.entries.map((entry) => {
                      const idx = flatEntries.indexOf(entry);
                      const Icon = entry.icon;
                      const active = idx === activeIndex;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            data-search-index={idx}
                            onClick={() => navigate(entry)}
                            className={cn(
                              "flex w-full items-start gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors",
                              active
                                ? "bg-accent-blue-soft text-foreground"
                                : "hover:bg-card-muted"
                            )}
                          >
                            {Icon ? (
                              <Icon
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0",
                                  active ? "text-accent-blue" : "text-muted"
                                )}
                                aria-hidden
                              />
                            ) : (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body-sm font-medium text-foreground">
                                {entry.title}
                              </span>
                              {entry.subtitle ? (
                                <span className="mt-0.5 block truncate text-caption text-muted">
                                  {entry.subtitle}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
