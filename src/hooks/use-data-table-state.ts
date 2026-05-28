"use client";

import * as React from "react";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;

type Options<T> = {
  data: T[];
  /** Champs interrogés par la recherche plein-texte (avec accessor). */
  searchAccessors?: ((row: T) => string | undefined | null)[];
  /** Accesseurs par clé de tri. */
  sortAccessors?: Record<string, (row: T) => string | number | Date>;
  /** Prédicats de filtre additionnels. */
  filters?: ((row: T) => boolean)[];
  pageSize?: number;
  initialSort?: SortState;
};

export type DataTableState<T> = {
  /** Données filtrées + triées + paginées (à passer à la table). */
  visible: T[];
  /** Total après filtrage + recherche (avant pagination). */
  totalItems: number;

  search: string;
  setSearch: (v: string) => void;

  sort: SortState;
  toggleSort: (key: string) => void;
  setSort: (s: SortState) => void;

  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
};

const DEFAULT_PAGE_SIZE = 10;

function normalize(value: string | undefined | null): string {
  return (value ?? "").toString().toLowerCase().trim();
}

/**
 * Hook standardisé pour les tableaux métier.
 * Centralise recherche, tri et pagination.
 */
export function useDataTableState<T>({
  data,
  searchAccessors = [],
  sortAccessors = {},
  filters = [],
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  initialSort = null,
}: Options<T>): DataTableState<T> {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(initialSort);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // Filtrage + recherche
  const filtered = React.useMemo(() => {
    const q = normalize(search);
    return data.filter((row) => {
      for (const f of filters) {
        if (!f(row)) return false;
      }
      if (!q) return true;
      if (searchAccessors.length === 0) return true;
      return searchAccessors.some((acc) => normalize(acc(row)).includes(q));
    });
  }, [data, search, filters, searchAccessors]);

  // Tri
  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const accessor = sortAccessors[sort.key];
    if (!accessor) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      const dir = sort.direction === "asc" ? 1 : -1;
      if (av instanceof Date && bv instanceof Date) {
        return (av.getTime() - bv.getTime()) * dir;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), "fr", { numeric: true }) * dir;
    });
    return arr;
  }, [filtered, sort, sortAccessors]);

  // Pagination
  const totalItems = sorted.length;
  const visible = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Reset de page si data ou taille changent et débordent
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [totalItems, pageSize, page]);

  // Reset à la page 1 quand la recherche change
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const toggleSort = React.useCallback((key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }, []);

  return {
    visible,
    totalItems,
    search,
    setSearch,
    sort,
    toggleSort,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
}
