"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { ShoppingCart } from "lucide-react";

import { SalesDayGroupActions } from "@/components/sales/sales-day-group-actions";
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
import {
  useProductionStore,
  useTransfersStore,
  useFarmConfig,
} from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import {
  dayKeyFromISO,
  formatSalesClientsSummary,
  groupSalesByDay,
  type SalesDayGroup,
} from "@/lib/day-entry-grouping";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { BrokenEggsMetric } from "@/components/shared/broken-eggs-metric";
import { SHOW_VENTE_CASSES } from "@/lib/feature-flags";
import { formatGNF } from "@/lib/format";
import { buildSaleRowViews } from "@/lib/sales-calc";
import { cn } from "@/lib/utils";
import type { EntreeStatut, Vente } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actives" },
  { id: "annule", label: "Annulées" },
  { id: "archive", label: "Archivées" },
  { id: "tous", label: "Toutes" },
];

type Props = {
  data: Vente[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Vente) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
  initialQ?: string | null;
};

export function SalesTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
  initialQ,
}: Props) {
  const { state: prodState } = useProductionStore();
  const { getAllTransfers } = useTransfersStore();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    initialStatut ?? "actif"
  );

  React.useEffect(() => {
    if (initialStatut) setStatusFilter(initialStatut);
  }, [initialStatut]);

  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;

  const allRows = React.useMemo(
    () => buildSaleRowViews(data, prodState.productions, getAllTransfers(), cap),
    [data, prodState.productions, getAllTransfers, cap]
  );

  const dayGroups = React.useMemo(() => {
    const visibleDayKeys = new Set<string>();
    for (const row of allRows) {
      if (statusFilter !== "tous" && row.vente.statut !== statusFilter) continue;
      if (initialJour) {
        try {
          if (
            !isSameDay(startOfDay(parseISO(initialJour)), new Date(row.vente.jourISO))
          ) {
            continue;
          }
        } catch {
          /* ignore invalid deep link */
        }
      }
      visibleDayKeys.add(dayKeyFromISO(row.vente.jourISO));
    }
    const rowsForDays = allRows.filter((r) =>
      visibleDayKeys.has(dayKeyFromISO(r.vente.jourISO))
    );
    return groupSalesByDay(rowsForDays, cap);
  }, [allRows, statusFilter, initialJour, cap]);

  const table = useDataTableState<SalesDayGroup>({
    data: dayGroups,
    searchAccessors: [
      (g) => formatDay(new Date(g.jourISO)),
      (g) => formatSalesClientsSummary(g.clients, g.count),
      (g) => String(g.totalAlveoles),
      (g) => g.prixLabel,
      (g) => formatGNF(g.totalMontant),
      (g) => g.entries.map((e) => e.vente.client ?? "").join(" "),
      (g) => g.entries.map((e) => formatGNF(e.montant)).join(" "),
    ],
    sortAccessors: {
      jour: (g) => new Date(g.jourISO),
      recu: (g) => g.recuAlveoles,
      vendus: (g) => g.totalAlveoles,
      casses: (g) => g.totalCassesOeufs,
      reste: (g) => g.resteAlveoles,
      prix: (g) => g.prixMin,
      montant: (g) => g.totalMontant,
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
    initialSearch: initialQ,
  });

  const columns: DataTableColumn<SalesDayGroup>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "34%",
      cell: (group) => (
        <div className="min-w-0">
          <p className="capitalize">{formatDay(new Date(group.jourISO))}</p>
          {group.count > 1 ? (
            <p className="truncate text-label text-muted">
              {formatSalesClientsSummary(group.clients, group.count)}
            </p>
          ) : group.clients[0] ? (
            <p className="truncate text-label text-muted">{group.clients[0]}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "recu",
      header: "Reçu",
      sortable: true,
      hideBelow: "lg",
      cell: (group) => (
        <AdaptiveMetric value={group.recuAlveoles} kind="number" className="text-muted" />
      ),
    },
    {
      key: "vendus",
      header: "Vendu",
      sortable: true,
      width: "16%",
      cell: (group) => (
        <AdaptiveMetric value={group.totalAlveoles} kind="number" className="font-semibold" />
      ),
    },
    ...(SHOW_VENTE_CASSES
      ? [
          {
            key: "casses" as const,
            header: "Cassés",
            sortable: true,
            hideBelow: "md" as const,
            cell: (group: SalesDayGroup) => (
              <BrokenEggsMetric value={group.totalCassesOeufs} showUnit={false} />
            ),
          },
        ]
      : []),
    {
      key: "reste",
      header: "Reste",
      sortable: true,
      hideBelow: "lg",
      cell: (group) => {
        const r = group.resteAlveoles;
        return (
          <AdaptiveMetric
            value={r}
            kind="number"
            className={cn(
              r > 0 && "text-success",
              r === 0 && "text-muted",
              r < 0 && "text-danger"
            )}
          />
        );
      },
    },
    {
      key: "prix",
      header: "Prix",
      sortable: true,
      width: "18%",
      hideBelow: "md",
      cell: (group) =>
        group.count > 1 && group.prixMin !== group.prixMax ? (
          <span className="text-label text-muted">{group.prixLabel}</span>
        ) : (
          <AdaptiveMetric value={group.prixMin} kind="gnf" />
        ),
    },
    {
      key: "montant",
      header: "Montant",
      sortable: true,
      width: "22%",
      cell: (group) => (
        <AdaptiveMetric value={group.totalMontant} kind="gnf" className="font-semibold" />
      ),
    },
    {
      key: "statut",
      header: "Statut",
      width: "4.75rem",
      noTruncate: true,
      cell: (group) => <DayGroupStatusBadge group={group} masculine />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "48px",
      noTruncate: true,
      cell: (group) => (
        <SalesDayGroupActions group={group} onRequestEdit={onRequestEdit} />
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
            placeholder="Rechercher un client, un jour, un montant…"
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
          <DataTable<SalesDayGroup>
            data={table.visible}
            columns={columns}
            rowKey={(g) => g.dayKey}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(group) =>
              cn(group.statut === "annule" && "opacity-60")
            }
            emptyState={
              <EmptyState
                icon={ShoppingCart}
                title={
                  table.search || statusFilter !== "actif"
                    ? "Aucune vente ne correspond aux filtres"
                    : "Aucune vente saisie pour cette période"
                }
                description={
                  table.search || statusFilter !== "actif"
                    ? "Ajuste la recherche ou change le filtre de statut."
                    : "Utilise le bouton « Ajouter une vente » pour démarrer."
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
