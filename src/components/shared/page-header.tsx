import * as React from "react";

import { cn } from "@/lib/utils";
import { pageDescClass, pageTitleClass } from "@/lib/typography-tokens";

type PageHeaderProps = {
  title: string;
  /** Une seule ligne courte — Dashboard uniquement en pratique. */
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * En-tête de page — titre dominant, zéro bruit.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className={pageTitleClass}>{title}</h1>
        {description ? (
          <p className={cn("mt-1", pageDescClass)}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
