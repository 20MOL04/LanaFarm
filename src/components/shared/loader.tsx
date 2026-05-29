import * as React from "react";

import { cn } from "@/lib/utils";

type LoaderProps = {
  className?: string;
  /** En px — 16 par défaut. */
  size?: number;
  label?: string;
};

export function Loader({ className, size = 16, label }: LoaderProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-muted", className)}
    >
      <span
        className="inline-block animate-spin rounded-full border-2 border-border border-t-accent-blue"
        style={{ width: size, height: size }}
      />
      {label ? <span className="text-label">{label}</span> : null}
      <span className="sr-only">Chargement…</span>
    </span>
  );
}

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-card-muted",
        className
      )}
      {...props}
    />
  );
}
