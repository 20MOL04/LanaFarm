"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import type { SortState } from "@/hooks/use-data-table-state";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  sortable?: boolean;
  primary?: boolean;
  /** Masque la colonne en dessous du breakpoint (évite scroll horizontal). */
  hideBelow?: "sm" | "md" | "lg";
};

const hideClass: Record<NonNullable<DataTableColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyState?: React.ReactNode;
  rowClassName?: (row: T, index: number) => string | undefined;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  className?: string;
  caption?: string;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyState,
  rowClassName,
  sort,
  onSortChange,
  className,
  caption,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className={cn("py-6", className)}>{emptyState}</div>;
  }

  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <table className="w-full table-fixed border-collapse text-[13.5px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border bg-card-muted/30">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "overflow-hidden px-2 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted sm:px-3",
                    col.hideBelow && hideClass[col.hideBelow],
                    col.align === "center" && "text-center",
                    (!col.align || col.align === "left" || col.align === "right") &&
                      "text-left",
                    col.className
                  )}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.key)}
                      className={cn(
                        "inline-flex max-w-full cursor-pointer items-center gap-1 transition-colors duration-150",
                        "hover:text-accent-blue",
                        col.align === "center" && "justify-center",
                        isSorted && "text-accent-blue"
                      )}
                    >
                      <span className="truncate">{col.header}</span>
                      {isSorted ? (
                        sort?.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                      )}
                    </button>
                  ) : (
                    <span className="block truncate">{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className={cn(
                "cursor-pointer border-b border-border transition-colors duration-150 last:border-b-0",
                "hover:bg-accent-blue-soft/40",
                rowClassName?.(row, index)
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "overflow-hidden px-2 py-2.5 text-foreground sm:px-3",
                    col.hideBelow && hideClass[col.hideBelow],
                    col.primary && "font-semibold",
                    col.align === "center" && "text-center",
                    (!col.align || col.align === "left" || col.align === "right") &&
                      "text-left tabular-nums",
                    col.className
                  )}
                >
                  <div className="min-w-0 max-w-full truncate [&>*]:truncate">
                    {col.cell(row, index)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
