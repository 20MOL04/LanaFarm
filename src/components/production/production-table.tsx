"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Egg } from "lucide-react";

import { ProductionRowActions } from "@/components/production/production-row-actions";
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
import { formatDay } from "@/lib/date-ranges";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { BrokenEggsMetric } from "@/components/shared/broken-eggs-metric";
import { calcAlveolesRestantesJour } from "@/lib/production-calc";
import { eggsToTrays } from "@/lib/terminology";
import { cn } from "@/lib/utils";
import type { EntreeStatut, Production } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actives" },
  { id: "annule", label: "Annulées" },
  { id: "archive", label: "Archivées" },
  { id: "tous", label: "Toutes" },
];

type Props = {
  data: Production[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Production) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
};

export function ProductionTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
}: Props) {
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    initialStatut ?? "actif"
  );

  React.useEffect(() => {
    if (initialStatut) setStatusFilter(initialStatut);
  }, [initialStatut]);

  const statusPredicate = React.useCallback(
    (row: Production) => statusFilter === "tous" || row.statut === statusFilter,
    [statusFilter]
  );

  const jourPredicate = React.useCallback(
    (row: Production) => {
      if (!initialJour) return true;
      try {
        return isSameDay(startOfDay(parseISO(initialJour)), new Date(row.jourISO));
      } catch {
        return true;
      }
    },
    [initialJour]
  );

  const table = useDataTableState<Production>({
    data,
    filters: [statusPredicate, jourPredicate],
    searchAccessors: [
      (r) => formatDay(new Date(r.jourISO)),
      (r) => r.notes,
      (r) => String(r.production),
      (r) => String(r.envoyesVente),
    ],
    sortAccessors: {
      jour: (r) => new Date(r.jourISO),
      ramassees: (r) => r.production,
      casses: (r) => r.casses,
      mises: (r) => r.envoyesVente,
      restantes: (r) => calcAlveolesRestantesJour(r, cap),
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
  });

  const columns: DataTableColumn<Production>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "28%",
      cell: (row) => (
        <span className="capitalize">{formatDay(new Date(row.jourISO))}</span>
      ),
    },
    {
      key: "ramassees",
      header: "Ramassées",
      sortable: true,
      cell: (row) => (
        <AdaptiveMetric
          value={eggsToTrays(row.production, cap)}
          kind="number"
        />
      ),
    },
    {
      key: "mises",
      header: "Mises vente",
      sortable: true,
      hideBelow: "sm",
      cell: (row) => (
        <AdaptiveMetric
          value={eggsToTrays(row.envoyesVente, cap)}
          kind="number"
        />
      ),
    },
    {
      key: "restantes",
      header: "Restantes",
      sortable: true,
      width: "16%",
      cell: (row) => {
        const rest = calcAlveolesRestantesJour(row, cap);
        return (
          <AdaptiveMetric
            value={rest}
            kind="number"
            className={cn(
              rest > 0 && "text-success",
              rest === 0 && "text-muted",
              rest < 0 && "text-danger"
            )}
          />
        );
      },
    },
    {
      key: "casses",
      header: "Cassés",
      sortable: true,
      hideBelow: "md",
      cell: (row) => <BrokenEggsMetric value={row.casses} showUnit={false} />,
    },
    {
      key: "statut",
      header: "Statut",
      cell: (row) => <EntryStatusBadge statut={row.statut} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "56px",
      cell: (row) => (
        <ProductionRowActions entry={row} onRequestEdit={onRequestEdit} />
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
            placeholder="Rechercher un jour, une note…"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-10 w-full sm:w-44">
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

        <div className="w-full min-w-0 max-w-full rounded-card border border-border shadow-card">
          <DataTable<Production>
            data={table.visible}
            columns={columns}
            rowKey={(r) => r.id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(r) =>
              r.statut === "annule" ? "opacity-60" : undefined
            }
            emptyState={
              <EmptyState
                icon={Egg}
                title={
                  table.search || statusFilter !== "actif"
                    ? "Aucune saisie ne correspond aux filtres"
                    : "Aucune production saisie pour cette période"
                }
                description={
                  table.search || statusFilter !== "actif"
                    ? "Ajuste la recherche ou change le filtre de statut."
                    : "Utilise le bouton « Ajouter une production » pour démarrer."
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

