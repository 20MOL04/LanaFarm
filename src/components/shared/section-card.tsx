import * as React from "react";

import { surfaceCardClass } from "@/lib/display-tokens";
import { cn } from "@/lib/utils";

type SectionCardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "div";
};

export function SectionCard({
  className,
  as: Tag = "section",
  ...props
}: SectionCardProps) {
  return (
    <Tag
      className={cn(
        "w-full min-w-0 max-w-full overflow-hidden",
        surfaceCardClass,
        className
      )}
      {...props}
    />
  );
}

type SectionHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title: React.ReactNode;
  actions?: React.ReactNode;
  /** En-tête plus serré — panneaux dashboard secondaires. */
  compact?: boolean;
};

export function SectionHeader({
  title,
  actions,
  compact = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border",
        compact ? "px-3 py-2" : "gap-3 px-4 py-3",
        className
      )}
      {...props}
    >
      <h2
        className={cn(
          "min-w-0 flex-1 truncate font-semibold text-foreground",
          compact ? "text-sm" : "text-title"
        )}
      >
        {title}
      </h2>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

type SectionBodyProps = React.HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
};

export function SectionBody({
  className,
  compact = false,
  ...props
}: SectionBodyProps) {
  return (
    <div
      className={cn(
        compact ? "px-3 pb-2.5 pt-3" : "px-4 py-3",
        className
      )}
      {...props}
    />
  );
}
