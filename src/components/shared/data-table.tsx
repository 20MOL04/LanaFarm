"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import type { SortState } from "@/hooks/use-data-table-state";
import { tableHeaderClass, tableTextClass } from "@/lib/typography-tokens";
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
  /** Masque la colonne en dessous du breakpoint. */
  hideBelow?: "sm" | "md" | "lg";
  /** Ne pas tronquer le contenu (statut, actions). */
  noTruncate?: boolean;
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

type DataTableRowProps<T> = {
  row: T;
  index: number;
  columns: DataTableColumn<T>[];
  rowClassName?: (row: T, index: number) => string | undefined;
};

function DataTableRowInner<T>({
  row,
  index,
  columns,
  rowClassName,
}: DataTableRowProps<T>) {
  return (
    <tr
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
            "px-2 py-2 text-foreground sm:px-3",
            !col.noTruncate && "overflow-hidden",
            col.hideBelow && hideClass[col.hideBelow],
            col.primary && "font-semibold",
            col.align === "center" && "text-center",
            (!col.align || col.align === "left" || col.align === "right") &&
              "text-left tabular-nums",
            col.className
          )}
        >
          <div
            className={cn(
              "min-w-0 max-w-full",
              !col.noTruncate && "[&>*]:truncate"
            )}
          >
            {col.cell(row, index)}
          </div>
        </td>
      ))}
    </tr>
  );
}

const DataTableRow = React.memo(DataTableRowInner) as typeof DataTableRowInner;

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
      <table className={cn("w-full table-fixed border-collapse", tableTextClass)}>
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
                    "px-2 py-2 sm:px-3",
                    tableHeaderClass,
                    !col.noTruncate && "overflow-hidden",
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
                      <span className={cn(!col.noTruncate && "truncate")}>{col.header}</span>
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
                    <span className={cn("block", !col.noTruncate && "truncate")}>
                      {col.header}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <DataTableRow
              key={rowKey(row, index)}
              row={row}
              index={index}
              columns={columns}
              rowClassName={rowClassName}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
