"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type PreviewPanelShellProps = {
  children: React.ReactNode;
  variant?: "default" | "danger";
  className?: string;
};

export function PreviewPanelShell({
  children,
  variant = "default",
  className,
}: PreviewPanelShellProps) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-card border px-3 py-2.5",
        variant === "danger"
          ? "border-danger/30 bg-danger-soft/60"
          : "border-border bg-card-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

type PreviewGridProps = {
  children: React.ReactNode;
  cols?: 2 | 3;
  className?: string;
};

export function PreviewGrid({ children, cols = 3, className }: PreviewGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-x-3 gap-y-2 text-sm",
        cols === 3 ? "grid-cols-3" : "grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

type PreviewCellTone = "danger" | "success";

type PreviewCellProps = {
  label: string;
  value: string;
  sub?: string;
  tone?: PreviewCellTone;
};

export function PreviewCell({ label, value, sub, tone }: PreviewCellProps) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium leading-tight text-muted">{label}</p>
      <p
        className={cn(
          "text-[13px] font-semibold tabular-nums leading-snug",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            "text-[10px] tabular-nums leading-tight",
            tone === "danger" ? "text-danger" : "text-muted"
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}
