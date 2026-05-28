"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Receipt } from "lucide-react";

import { CategoryBadge } from "@/components/expenses/category-badge";
import { ExpensesRowActions } from "@/components/expenses/expenses-row-actions";
import { EntryStatusBadge } from "@/components/shared/entry-status-badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useFarmConfig } from "@/contexts/farm-store";
import {
  getActiveCategorieLabels,
  resolveCategorieLabel,
} from "@/lib/config-defaults";
import { formatDay } from "@/lib/date-ranges";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { cn } from "@/lib/utils";
import type { Depense, EntreeStatut, FarmConfig } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;
type CategoryFilter = "toutes" | string;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actives" },
  { id: "annule", label: "Annulées" },
  { id: "archive", label: "Archivées" },
  { id: "tous", label: "Toutes" },
];

type DayMeta = {
  total: number;
  count: number;
  labels: string[];
};

type Props = {
  data: Depense[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Depense) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
  initialCategorie?: string | null;
};

function expenseDayKey(row: Depense): string {
  return startOfDay(new Date(row.jourISO)).toISOString();
}

function buildExpenseDayMeta(rows: Depense[], config: FarmConfig): Map<string, DayMeta> {
  const map = new Map<string, DayMeta>();
  for (const row of rows) {
    const k = expenseDayKey(row);
    const label = resolveCategorieLabel(row.categorie, config.listes.categoriesDepense);
    const cur = map.get(k) ?? { total: 0, count: 0, labels: [] };
    cur.total += row.montant;
    cur.count += 1;
    if (!cur.labels.includes(label)) cur.labels.push(label);
    map.set(k, cur);
  }
  return map;
}

function formatCategoriesSummary(labels: string[]): string {
  if (labels.length === 0) return "—";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} (+${labels.length - 2})`;
}

function isFirstRowOfDay(rows: Depense[], index: number): boolean {
  if (index <= 0) return true;
  return expenseDayKey(rows[index - 1]) !== expenseDayKey(rows[index]);
}

export function ExpensesTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
  initialCategorie,
}: Props) {
  const config = useFarmConfig();
  const filterLabels = React.useMemo(
    () => getActiveCategorieLabels(config),
    [config]
  );
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    initialStatut ?? "actif"
  );
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>(
    initialCategorie ?? "toutes"
  );

  React.useEffect(() => {
    if (initialStatut) setStatusFilter(initialStatut);
  }, [initialStatut]);

  React.useEffect(() => {
    if (initialCategorie) setCategoryFilter(initialCategorie);
  }, [initialCategorie]);

  const filters = React.useMemo(
    () => [
      (row: Depense) => statusFilter === "tous" || row.statut === statusFilter,
      (row: Depense) =>
        categoryFilter === "toutes" ||
        resolveCategorieLabel(row.categorie, config.listes.categoriesDepense) ===
          categoryFilter,
      (row: Depense) => {
        if (!initialJour) return true;
        try {
          return isSameDay(startOfDay(parseISO(initialJour)), new Date(row.jourISO));
        } catch {
          return true;
        }
      },
    ],
    [statusFilter, categoryFilter, config, initialJour]
  );

  const table = useDataTableState<Depense>({
    data,
    filters,
    searchAccessors: [
      (r) => formatDay(new Date(r.jourISO)),
      (r) => resolveCategorieLabel(r.categorie, config.listes.categoriesDepense),
      (r) => r.description,
      (r) => String(r.montant),
    ],
    sortAccessors: {
      jour: (r) => new Date(r.jourISO),
      categorie: (r) =>
        resolveCategorieLabel(r.categorie, config.listes.categoriesDepense),
      montant: (r) => r.montant,
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
  });

  const dayMeta = React.useMemo(
    () => buildExpenseDayMeta(table.visible, config),
    [table.visible, config]
  );

  const columns: DataTableColumn<Depense>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "28%",
      cell: (row, index) => {
        if (!isFirstRowOfDay(table.visible, index)) {
          return <span className="text-muted" aria-hidden>·</span>;
        }
        const meta = dayMeta.get(expenseDayKey(row));
        return (
          <div className="min-w-0">
            <span className="capitalize">{formatDay(new Date(row.jourISO))}</span>
            {meta && meta.count > 1 ? (
              <p className="text-[10px] text-muted">{meta.count} dépenses</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "categorie",
      header: "Catégorie",
      sortable: true,
      hideBelow: "sm",
      cell: (row, index) => {
        const meta = dayMeta.get(expenseDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <span className="line-clamp-2 text-[12px] font-medium text-foreground">
              {formatCategoriesSummary(meta.labels)}
            </span>
          );
        }
        return <CategoryBadge category={row.categorie} />;
      },
    },
    {
      key: "montant",
      header: "Montant",
      sortable: true,
      width: "24%",
      cell: (row, index) => {
        const meta = dayMeta.get(expenseDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <AdaptiveMetric value={meta.total} kind="gnf" className="font-semibold" />
          );
        }
        return <AdaptiveMetric value={row.montant} kind="gnf" className="font-semibold" />;
      },
    },
    {
      key: "description",
      header: "Description",
      hideBelow: "md",
      cell: (row, index) => {
        const meta = dayMeta.get(expenseDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return <span className="text-muted">—</span>;
        }
        return row.description ? (
          <span className="line-clamp-1 text-foreground">{row.description}</span>
        ) : (
          <span className="text-muted">—</span>
        );
      },
    },
    {
      key: "statut",
      header: "Statut",
      cell: (row, index) => {
        const meta = dayMeta.get(expenseDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return null;
        return <EntryStatusBadge statut={row.statut} />;
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "56px",
      cell: (row, index) => {
        const meta = dayMeta.get(expenseDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return null;
        return <ExpensesRowActions entry={row} onRequestEdit={onRequestEdit} />;
      },
    },
  ];

  return (
    <SectionCard>
      <SectionHeader title="Saisies" actions={headerActions} />
      <SectionBody className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={table.search}
            onValueChange={table.setSearch}
            placeholder="Rechercher une catégorie, une description, un montant…"
          />
          <div className="flex gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
            >
              <SelectTrigger className="h-10 w-44">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                {filterLabels.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full min-w-0 max-w-full rounded-card border border-border shadow-card">
          <DataTable<Depense>
            data={table.visible}
            columns={columns}
            rowKey={(r) => r.id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(row, index) => {
              const isFirst = isFirstRowOfDay(table.visible, index);
              const meta = dayMeta.get(expenseDayKey(row));
              const isGroupedChild = !isFirst && meta && meta.count > 1;
              return cn(
                row.statut === "annule" && "opacity-60",
                isFirst && index > 0 && "border-t border-border",
                isGroupedChild && "bg-card-muted/25"
              );
            }}
            emptyState={
              <EmptyState
                icon={Receipt}
                title={
                  table.search || statusFilter !== "actif" || categoryFilter !== "toutes"
                    ? "Aucune dépense ne correspond aux filtres"
                    : "Aucune dépense saisie pour cette période"
                }
                description={
                  table.search || statusFilter !== "actif" || categoryFilter !== "toutes"
                    ? "Ajuste la recherche, la catégorie ou le statut."
                    : "Utilise le bouton « Ajouter une dépense » pour démarrer."
                }
              />
            }
          />
          {table.totalItems > 0 ? (
            <div className="border-t border-border">
              <Pagination
                page={table.page}
                pageSize={table.pageSize}
                totalItems={table.totalItems}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
              />
            </div>
          ) : null}
        </div>
      </SectionBody>
    </SectionCard>
  );
}

