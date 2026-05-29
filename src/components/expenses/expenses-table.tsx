"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Receipt } from "lucide-react";

import { ExpensesDayGroupActions } from "@/components/expenses/expenses-day-group-actions";
import { DayGroupStatusBadge } from "@/components/shared/entry-status-badge";
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
import {
  dayKeyFromISO,
  formatCategoriesSummary,
  groupExpensesByDay,
  type ExpenseDayGroup,
} from "@/lib/day-entry-grouping";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { formatGNF } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Depense, EntreeStatut } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;
type CategoryFilter = "toutes" | string;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actives" },
  { id: "annule", label: "Annulées" },
  { id: "archive", label: "Archivées" },
  { id: "tous", label: "Toutes" },
];

type Props = {
  data: Depense[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Depense) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
  initialCategorie?: string | null;
  initialQ?: string | null;
};

export function ExpensesTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
  initialCategorie,
  initialQ,
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

  const dayGroups = React.useMemo(() => {
    const visibleDayKeys = new Set<string>();
    for (const row of data) {
      if (statusFilter !== "tous" && row.statut !== statusFilter) continue;
      if (
        categoryFilter !== "toutes" &&
        resolveCategorieLabel(row.categorie, config.listes.categoriesDepense) !==
          categoryFilter
      ) {
        continue;
      }
      if (initialJour) {
        try {
          if (!isSameDay(startOfDay(parseISO(initialJour)), new Date(row.jourISO))) {
            continue;
          }
        } catch {
          /* ignore invalid deep link */
        }
      }
      visibleDayKeys.add(dayKeyFromISO(row.jourISO));
    }
    const rowsForDays = data.filter((r) => visibleDayKeys.has(dayKeyFromISO(r.jourISO)));
    return groupExpensesByDay(rowsForDays, config);
  }, [data, statusFilter, categoryFilter, config, initialJour]);

  const table = useDataTableState<ExpenseDayGroup>({
    data: dayGroups,
    searchAccessors: [
      (g) => formatDay(new Date(g.jourISO)),
      (g) => formatCategoriesSummary(g.categories),
      (g) => formatGNF(g.totalMontant),
      (g) => g.descriptionLabel,
      (g) =>
        g.entries
          .map((e) => resolveCategorieLabel(e.categorie, config.listes.categoriesDepense))
          .join(" "),
      (g) => g.entries.map((e) => e.description ?? "").join(" "),
    ],
    sortAccessors: {
      jour: (g) => new Date(g.jourISO),
      categorie: (g) => formatCategoriesSummary(g.categories),
      montant: (g) => g.totalMontant,
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
    initialSearch: initialQ,
  });

  const columns: DataTableColumn<ExpenseDayGroup>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "28%",
      cell: (group) => (
        <div className="min-w-0">
          <span className="capitalize">{formatDay(new Date(group.jourISO))}</span>
          {group.count > 1 ? (
            <p className="text-caption text-muted">{group.count} dépenses</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "categorie",
      header: "Catégorie",
      sortable: true,
      hideBelow: "sm",
      cell: (group) => (
        <span className="line-clamp-2 text-body-sm font-medium text-foreground">
          {formatCategoriesSummary(group.categories)}
        </span>
      ),
    },
    {
      key: "montant",
      header: "Montant",
      sortable: true,
      width: "24%",
      cell: (group) => (
        <AdaptiveMetric value={group.totalMontant} kind="gnf" className="font-semibold" />
      ),
    },
    {
      key: "description",
      header: "Description",
      hideBelow: "md",
      cell: (group) =>
        group.descriptionLabel !== "—" ? (
          <span className="line-clamp-1 text-foreground">{group.descriptionLabel}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "statut",
      header: "Statut",
      width: "4.75rem",
      noTruncate: true,
      cell: (group) => <DayGroupStatusBadge group={group} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "48px",
      noTruncate: true,
      cell: (group) => (
        <ExpensesDayGroupActions group={group} onRequestEdit={onRequestEdit} />
      ),
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
          <DataTable<ExpenseDayGroup>
            data={table.visible}
            columns={columns}
            rowKey={(g) => g.dayKey}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(group) => cn(group.statut === "annule" && "opacity-60")}
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
