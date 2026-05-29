"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  findClosestMatch,
  fuzzyMatch,
  normalize,
} from "@/lib/fuzzy-match";
import { cn } from "@/lib/utils";

export type ComboboxConfigItem = {
  id: string;
  label: string;
  actif?: boolean;
};

type Props = {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  items: ComboboxConfigItem[];
  resolveLabel: (id: string, items: ComboboxConfigItem[]) => string;
  placeholder?: string;
  onCreate?: (label: string) => void;
  createError?: string | null;
  onClearError?: () => void;
  duplicateErrorCode?: string;
  className?: string;
};

export function ComboboxConfig({
  id = "config-combobox",
  value,
  onChange,
  items,
  resolveLabel,
  placeholder = "Rechercher…",
  onCreate,
  createError,
  onClearError,
  duplicateErrorCode,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pendingCreateRef = React.useRef<string | null>(null);

  const displayLabel = React.useMemo(
    () => (value ? resolveLabel(value, items) : ""),
    [value, items, resolveLabel]
  );

  React.useEffect(() => {
    if (!open) setInputValue(displayLabel);
  }, [displayLabel, open]);

  const activeItems = React.useMemo(
    () => items.filter((item) => item.actif !== false),
    [items]
  );

  const activeLabels = React.useMemo(
    () => activeItems.map((item) => item.label.trim() || item.id),
    [activeItems]
  );

  const suggestions = React.useMemo(() => {
    const q = inputValue.trim();
    if (!q) return activeItems;
    return activeItems.filter((item) =>
      fuzzyMatch(q, item.label.trim() || item.id)
    );
  }, [inputValue, activeItems]);

  const trimmed = inputValue.trim();
  const closestMatch = trimmed ? findClosestMatch(trimmed, activeLabels) : null;
  const exactMatch = trimmed
    ? activeItems.find(
        (item) => normalize(item.label.trim() || item.id) === normalize(trimmed)
      )
    : undefined;
  const showCreate =
    !!onCreate && trimmed.length > 0 && !closestMatch && !exactMatch;

  const handleInputChange = (next: string) => {
    onClearError?.();
    setInputValue(next);
    setOpen(true);

    if (!next.trim()) {
      onChange("");
      return;
    }

    const hit = activeItems.find(
      (item) => normalize(item.label.trim() || item.id) === normalize(next.trim())
    );
    if (hit) {
      onChange(hit.id);
    }
  };

  const selectItem = (item: ComboboxConfigItem) => {
    onClearError?.();
    setInputValue(item.label.trim() || item.id);
    onChange(item.id);
    setOpen(false);
  };

  const handleCreate = () => {
    if (!onCreate || !trimmed || closestMatch || exactMatch) return;
    pendingCreateRef.current = trimmed;
    onCreate(trimmed);
  };

  React.useEffect(() => {
    const pending = pendingCreateRef.current;
    if (!pending) return;
    if (createError && duplicateErrorCode) {
      pendingCreateRef.current = null;
      return;
    }
    const created = items.find(
      (item) => normalize(item.label.trim() || item.id) === normalize(pending)
    );
    if (created) {
      selectItem(created);
      pendingCreateRef.current = null;
    }
  }, [items, createError, duplicateErrorCode]);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setInputValue((prev) => prev || displayLabel);
          }}
          onClick={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (!inputRef.current?.matches(":focus")) setOpen(false);
            }, 120);
          }}
          placeholder={placeholder}
          className={cn("h-8 w-full min-w-0", className)}
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
      </PopoverAnchor>
      <PopoverContent
        className="z-[100] w-[min(100vw-2rem,var(--radix-popover-trigger-width,12rem))] p-1"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <ul
          role="listbox"
          className="max-h-48 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                className="flex w-full rounded-sm px-2.5 py-1.5 text-left text-sm hover:bg-card-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectItem(item)}
              >
                {item.label.trim() || item.id}
              </button>
            </li>
          ))}

          {showCreate ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-border px-2.5 py-1.5 text-left text-sm font-medium text-accent-blue hover:bg-accent-blue-soft/40"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreate}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {`Créer « ${trimmed} »`}
              </button>
            </li>
          ) : null}

          {suggestions.length === 0 && !showCreate ? (
            <li className="px-2.5 py-1.5 text-xs text-muted">Aucune suggestion</li>
          ) : null}
        </ul>
        {createError ? (
          <p className="border-t border-border px-2.5 py-1.5 text-[11px] text-danger">
            {createError}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
