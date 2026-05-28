"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Wallet } from "lucide-react";

import { TresorerieRowActions } from "@/components/tresorerie/tresorerie-row-actions";
import { MethodBadge } from "@/components/tresorerie/method-badge";
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
  getActiveMethodeLabels,
  resolveMethodeLabel,
} from "@/lib/config-defaults";
import { formatDay } from "@/lib/date-ranges";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { calcReste } from "@/lib/tresorerie-calc";
import { cn } from "@/lib/utils";
import type { Tresorerie, EntreeStatut } from "@/types/domain";

type StatusFilter = "tous" | EntreeStatut;
type MethodFilter = "toutes" | string;

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "actif", label: "Actifs" },
  { id: "annule", label: "Annulés" },
  { id: "archive", label: "Archivés" },
  { id: "tous", label: "Tous" },
];

type Props = {
  data: Tresorerie[];
  headerActions?: React.ReactNode;
  onRequestEdit?: (entry: Tresorerie) => void;
  initialStatut?: EntreeStatut | null;
  initialJour?: string | null;
};

export function TresorerieTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
}: Props) {
  const config = useFarmConfig();
  const filterLabels = React.useMemo(
    () => getActiveMethodeLabels(config),
    [config]
  );
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    initialStatut ?? "actif"
  );
  const [methodFilter, setMethodFilter] = React.useState<MethodFilter>("toutes");

  React.useEffect(() => {
    if (initialStatut) setStatusFilter(initialStatut);
  }, [initialStatut]);

  const filters = React.useMemo(
    () => [
      (row: Tresorerie) => statusFilter === "tous" || row.statut === statusFilter,
      (row: Tresorerie) =>
        methodFilter === "toutes" ||
        resolveMethodeLabel(row.methode, config.listes.methodesPaiement) ===
          methodFilter,
      (row: Tresorerie) => {
        if (!initialJour) return true;
        try {
          return isSameDay(startOfDay(parseISO(initialJour)), new Date(row.jourISO));
        } catch {
          return true;
        }
      },
    ],
    [statusFilter, methodFilter, config, initialJour]
  );

  const table = useDataTableState<Tresorerie>({
    data,
    filters,
    searchAccessors: [
      (r) => formatDay(new Date(r.jourISO)),
      (r) => resolveMethodeLabel(r.methode, config.listes.methodesPaiement),
      (r) => r.note,
      (r) => String(r.montantRecu),
      (r) => String(r.depose),
    ],
    sortAccessors: {
      jour: (r) => new Date(r.jourISO),
      recu: (r) => r.montantRecu,
      depose: (r) => r.depose,
      reste: (r) => calcReste(r),
      methode: (r) =>
        resolveMethodeLabel(r.methode, config.listes.methodesPaiement),
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
  });

  const columns: DataTableColumn<Tresorerie>[] = [
    {
      key: "jour",
      header: "Jour",
      sortable: true,
      primary: true,
      width: "30%",
      cell: (row) => (
        <span className="capitalize">{formatDay(new Date(row.jourISO))}</span>
      ),
    },
    {
      key: "recu",
      header: "Reçu",
      sortable: true,
      width: "22%",
      cell: (row) => (
        <AdaptiveMetric value={row.montantRecu} kind="gnf" className="font-semibold" />
      ),
    },
    {
      key: "depose",
      header: "Versé",
      sortable: true,
      hideBelow: "sm",
      cell: (row) => (
        <AdaptiveMetric value={row.depose} kind="gnf" className="text-success" />
      ),
    },
    {
      key: "reste",
      header: "Reste",
      sortable: true,
      hideBelow: "md",
      cell: (row) => {
        const reste = calcReste(row);
        if (reste === 0) {
          return <span className="text-muted">—</span>;
        }
        return (
          <AdaptiveMetric
            value={reste}
            kind="gnf"
            className={cn(
              reste > 0 && "text-warning",
              reste < 0 && "text-danger"
            )}
          />
        );
      },
    },
    {
      key: "methode",
      header: "Méthode",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => <MethodBadge method={row.methode} />,
    },
    {
      key: "statut",
      header: "Statut",
      cell: (row) => <EntryStatusBadge statut={row.statut} masculine />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "56px",
      cell: (row) => (
        <TresorerieRowActions entry={row} onRequestEdit={onRequestEdit} />
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
            placeholder="Rechercher un jour, une méthode, un montant…"
          />
          <div className="flex gap-2">
            <Select
              value={methodFilter}
              onValueChange={(v) => setMethodFilter(v as MethodFilter)}
            >
              <SelectTrigger className="h-10 w-44">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes méthodes</SelectItem>
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
          <DataTable<Tresorerie>
            data={table.visible}
            columns={columns}
            rowKey={(r) => r.id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(r) => (r.statut === "annule" ? "opacity-60" : undefined)}
            emptyState={
              <EmptyState
                icon={Wallet}
                title={
                  table.search || statusFilter !== "actif" || methodFilter !== "toutes"
                    ? "Aucun trésorerie ne correspond aux filtres"
                    : "Aucun trésorerie saisi pour cette période"
                }
                description={
                  table.search || statusFilter !== "actif" || methodFilter !== "toutes"
                    ? "Ajuste la recherche, la méthode ou le statut."
                    : "Utilise le bouton « Ajouter un trésorerie » pour démarrer."
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

