"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SettingsSectionId = "profil" | "preferences" | "seuils" | "listes";

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
};

type Props = {
  items: SettingsNavItem[];
  activeSection: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
};

/**
 * Navigation Paramètres — verticale (desktop) et pills scrollables (mobile).
 */
export function SettingsNav({ items, activeSection, onSectionChange }: Props) {
  const itemClass = (id: SettingsSectionId, compact?: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md cursor-pointer text-sm transition-colors whitespace-nowrap",
      compact ? "shrink-0 px-3 py-2" : "w-full py-2 px-3",
      activeSection === id
        ? "bg-primary/10 text-primary border-l-2 border-primary"
        : "text-muted hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent"
    );

  return (
    <>
      <nav className="hidden md:block" aria-label="Sections des paramètres">
        <p className="px-3 pb-2 text-label font-medium uppercase tracking-wide text-muted">
          Sections
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={itemClass(item.id)}
                  aria-current={activeSection === item.id ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="flex gap-2 overflow-x-auto md:hidden"
        role="tablist"
        aria-label="Sections des paramètres"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
              className={itemClass(item.id, true)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
