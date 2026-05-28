"use client";

import * as React from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Mini menu contextuel basé sur le Popover Radix.
 * Suffisant pour les actions par ligne du module Production.
 * Un vrai DropdownMenu Radix sera introduit si besoin (sous-menus, raccourcis clavier).
 */

type MenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
};

export function Menu({ trigger, children, align = "end", className }: MenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn("w-56 p-1.5", className)}
      >
        <ul className="flex flex-col gap-0.5">{children}</ul>
      </PopoverContent>
    </Popover>
  );
}

type MenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  tone?: "default" | "danger";
};

export function MenuItem({
  icon,
  tone = "default",
  className,
  children,
  ...props
}: MenuItemProps) {
  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm",
          "transition-colors",
          tone === "default" &&
            "text-foreground hover:bg-card-muted disabled:text-muted disabled:hover:bg-transparent",
          tone === "danger" &&
            "text-danger hover:bg-danger-soft disabled:text-muted disabled:hover:bg-transparent",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      >
        {icon ? (
          <span className="flex h-4 w-4 items-center justify-center shrink-0">
            {icon}
          </span>
        ) : null}
        <span className="flex-1 truncate">{children}</span>
      </button>
    </li>
  );
}

export function MenuSeparator() {
  return <li className="my-1 h-px bg-border" aria-hidden="true" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-2.5 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted">
      {children}
    </li>
  );
}
