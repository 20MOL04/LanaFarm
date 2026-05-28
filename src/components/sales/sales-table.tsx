"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { ShoppingCart } from "lucide-react";

import { SalesRowActions } from "@/components/sales/sales-row-actions";
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
import {
  useProductionStore,
  useTransfersStore,
  useFarmConfig,
} from "@/contexts/farm-store";
import { formatDay } from "@/lib/date-ranges";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { BrokenEggsMetric } from "@/components/shared/broken-eggs-metric";
import { formatGNF, formatNumber } from "@/lib/format";
import { buildSaleRowViews, type SaleRowView } from "@/lib/sales-calc";
import { eggsToTrays } from "@/lib/terminology";
import { cn } from "@/lib/utils";
import type { EntreeStatut, Vente } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actives" },
  { id: "annule", label: "Annulées" },
  { id: "archive", label: "Archivées" },
  { id: "tous", label: "Toutes" },
];

type SaleDayMeta = {
  totalMontant: number;
  totalAlveoles: number;
  count: number;
  clients: string[];
};

type Props = {
  data: Vente[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Vente) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
};

function saleDayKey(row: SaleRowView): string {
  return startOfDay(new Date(row.vente.jourISO)).toISOString();
}

function buildSaleDayMeta(rows: SaleRowView[], cap: number): Map<string, SaleDayMeta> {
  const map = new Map<string, SaleDayMeta>();
  for (const row of rows) {
    const k = saleDayKey(row);
    const cur = map.get(k) ?? {
      totalMontant: 0,
      totalAlveoles: 0,
      count: 0,
      clients: [],
    };
    cur.totalMontant += row.montant;
    cur.totalAlveoles += eggsToTrays(row.vente.vendus, cap);
    cur.count += 1;
    const client = row.vente.client?.trim();
    if (client && !cur.clients.includes(client)) cur.clients.push(client);
    map.set(k, cur);
  }
  return map;
}

function formatSalesDaySummary(meta: SaleDayMeta): string {
  if (meta.count <= 1) return "";
  const clientPart =
    meta.clients.length > 0
      ? meta.clients.length <= 2
        ? meta.clients.join(", ")
        : `${meta.clients[0]} (+${meta.clients.length - 1})`
      : `${meta.count} ventes`;
  return clientPart;
}

function isFirstRowOfDay(rows: SaleRowView[], index: number): boolean {
  if (index <= 0) return true;
  return saleDayKey(rows[index - 1]) !== saleDayKey(rows[index]);
}

export function SalesTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
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

  const rows: SaleRowView[] = React.useMemo(
    () => buildSaleRowViews(data, prodState.productions, getAllTransfers(), cap),
    [data, prodState.productions, getAllTransfers, cap]
  );

  const statusPredicate = React.useCallback(
    (row: SaleRowView) =>
      statusFilter === "tous" || row.vente.statut === statusFilter,
    [statusFilter]
  );

  const jourPredicate = React.useCallback(
    (row: SaleRowView) => {
      if (!initialJour) return true;
      try {
        return isSameDay(
          startOfDay(parseISO(initialJour)),
          new Date(row.vente.jourISO)
        );
      } catch {
        return true;
      }
    },
    [initialJour]
  );

  const table = useDataTableState<SaleRowView>({
    data: rows,
    filters: [statusPredicate, jourPredicate],
    searchAccessors: [
      (r) => formatDay(new Date(r.vente.jourISO)),
      (r) => r.vente.client,
      (r) => String(r.vente.vendus),
      (r) => String(r.vente.prix),
      (r) => formatGNF(r.montant),
    ],
    sortAccessors: {
      jour: (r) => new Date(r.vente.jourISO),
      recu: (r) => r.recuFermeJour,
      vendus: (r) => r.vente.vendus,
      casses: (r) => r.vente.cassesVente,
      reste: (r) => r.resteVenteJour,
      prix: (r) => r.vente.prix,
      montant: (r) => r.montant,
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
  });

  const dayMeta = React.useMemo(
    () => buildSaleDayMeta(table.visible, cap),
    [table.visible, cap]
  );

  const columns: DataTableColumn<SaleRowView>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "34%",
      cell: (row, index) => {
        if (!isFirstRowOfDay(table.visible, index)) {
          return <span className="text-muted" aria-hidden>·</span>;
        }
        const meta = dayMeta.get(saleDayKey(row));
        return (
          <div className="min-w-0">
            <p className="capitalize">{formatDay(new Date(row.vente.jourISO))}</p>
            {meta && meta.count > 1 ? (
              <p className="truncate text-[11px] font-normal text-muted">
                {formatSalesDaySummary(meta)}
              </p>
            ) : row.vente.client ? (
              <p className="truncate text-[11px] font-normal text-muted">
                {row.vente.client}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "recu",
      header: "Reçu",
      sortable: true,
      hideBelow: "lg",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <span className="text-[12px] text-muted">
              {formatNumber(meta.totalAlveoles)} alv. vendues
            </span>
          );
        }
        return (
          <AdaptiveMetric
            value={eggsToTrays(row.recuFermeJour, cap)}
            kind="number"
            className="text-muted"
          />
        );
      },
    },
    {
      key: "vendus",
      header: "Vendu",
      sortable: true,
      width: "16%",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <AdaptiveMetric value={meta.totalAlveoles} kind="number" className="font-semibold" />
          );
        }
        return <AdaptiveMetric value={eggsToTrays(row.vente.vendus, cap)} kind="number" />;
      },
    },
    {
      key: "casses",
      header: "Cassés",
      sortable: true,
      hideBelow: "md",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return <span className="text-muted">—</span>;
        return <BrokenEggsMetric value={row.vente.cassesVente} showUnit={false} />;
      },
    },
    {
      key: "reste",
      header: "Reste",
      sortable: true,
      hideBelow: "lg",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return <span className="text-muted">—</span>;
        const r = eggsToTrays(row.resteVenteJour, cap);
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
      header: "Prix/casier",
      sortable: true,
      hideBelow: "md",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <span className="text-[11px] text-muted">
              {meta.count} lignes
            </span>
          );
        }
        return <AdaptiveMetric value={row.vente.prix} kind="gnf" />;
      },
    },
    {
      key: "montant",
      header: "Montant",
      sortable: true,
      width: "22%",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) {
          return (
            <AdaptiveMetric
              value={meta.totalMontant}
              kind="gnf"
              className="font-semibold"
            />
          );
        }
        return <AdaptiveMetric value={row.montant} kind="gnf" className="font-semibold" />;
      },
    },
    {
      key: "statut",
      header: "Statut",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return null;
        return (
          <EntryStatusBadge statut={row.vente.statut} />
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "56px",
      cell: (row, index) => {
        const meta = dayMeta.get(saleDayKey(row));
        const isFirst = isFirstRowOfDay(table.visible, index);
        if (isFirst && meta && meta.count > 1) return null;
        return <SalesRowActions entry={row.vente} onRequestEdit={onRequestEdit} />;
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
          <DataTable<SaleRowView>
            data={table.visible}
            columns={columns}
            rowKey={(r) => r.vente.id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(row, index) => {
              const isFirst = isFirstRowOfDay(table.visible, index);
              const meta = dayMeta.get(saleDayKey(row));
              const isGroupedChild = !isFirst && meta && meta.count > 1;
              return cn(
                row.vente.statut === "annule" && "opacity-60",
                isFirst && index > 0 && "border-t border-border",
                isGroupedChild && "bg-card-muted/25"
              );
            }}
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

