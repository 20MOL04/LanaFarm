"use client";

import * as React from "react";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Wallet } from "lucide-react";

import { TresorerieDayGroupActions } from "@/components/tresorerie/tresorerie-day-group-actions";
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
  getActiveMethodeLabels,
  resolveMethodeLabel,
} from "@/lib/config-defaults";
import { formatDay } from "@/lib/date-ranges";
import {
  dayKeyFromISO,
  formatMethodesSummary,
  groupTresorerieByDay,
  type TresorerieDayGroup,
} from "@/lib/day-entry-grouping";
import { AdaptiveMetric } from "@/components/shared/adaptive-metric";
import { formatGNF } from "@/lib/format";
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
  initialQ?: string | null;
};

export function TresorerieTable({
  data,
  headerActions,
  onRequestEdit,
  initialStatut,
  initialJour,
  initialQ,
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

  const dayGroups = React.useMemo(() => {
    const visibleDayKeys = new Set<string>();
    for (const row of data) {
      if (statusFilter !== "tous" && row.statut !== statusFilter) continue;
      if (
        methodFilter !== "toutes" &&
        resolveMethodeLabel(row.methode, config.listes.methodesPaiement) !== methodFilter
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
    return groupTresorerieByDay(rowsForDays, config);
  }, [data, statusFilter, methodFilter, config, initialJour]);

  const table = useDataTableState<TresorerieDayGroup>({
    data: dayGroups,
    searchAccessors: [
      (g) => formatDay(new Date(g.jourISO)),
      (g) => formatMethodesSummary(g.methodes),
      (g) => formatGNF(g.totalDepose),
      (g) => formatGNF(g.totalRecu),
      (g) =>
        g.entries
          .map((e) => resolveMethodeLabel(e.methode, config.listes.methodesPaiement))
          .join(" "),
      (g) => g.entries.map((e) => e.note ?? "").join(" "),
    ],
    sortAccessors: {
      jour: (g) => new Date(g.jourISO),
      verse: (g) => g.totalDepose,
      reste: (g) => g.totalReste,
      methode: (g) => formatMethodesSummary(g.methodes),
    },
    initialSort: { key: "jour", direction: "desc" },
    pageSize: 10,
    initialSearch: initialQ,
  });

  const columns: DataTableColumn<TresorerieDayGroup>[] = [
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
            <p className="text-caption text-muted">{group.count} versements</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "verse",
      header: "Versé",
      sortable: true,
      width: "24%",
      cell: (group) => (
        <AdaptiveMetric value={group.totalDepose} kind="gnf" className="font-semibold text-success" />
      ),
    },
    {
      key: "reste",
      header: "Reste",
      sortable: true,
      hideBelow: "sm",
      cell: (group) => {
        if (group.totalReste === 0) {
          return <span className="text-muted">—</span>;
        }
        return (
          <AdaptiveMetric
            value={group.totalReste}
            kind="gnf"
            className={cn(
              group.totalReste > 0 && "text-warning",
              group.totalReste < 0 && "text-danger"
            )}
          />
        );
      },
    },
    {
      key: "methode",
      header: "Méthode",
      sortable: true,
      hideBelow: "md",
      cell: (group) => (
        <span className="line-clamp-2 text-body-sm font-medium text-foreground">
          {formatMethodesSummary(group.methodes)}
        </span>
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
        <TresorerieDayGroupActions group={group} onRequestEdit={onRequestEdit} />
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
          <DataTable<TresorerieDayGroup>
            data={table.visible}
            columns={columns}
            rowKey={(g) => g.dayKey}
            sort={table.sort}
            onSortChange={table.toggleSort}
            rowClassName={(g) =>
              g.statut === "annule" ? "opacity-60" : undefined
            }
            emptyState={
              <EmptyState
                icon={Wallet}
                title={
                  table.search || statusFilter !== "actif" || methodFilter !== "toutes"
                    ? "Aucun versement ne correspond aux filtres"
                    : "Aucun versement saisi pour cette période"
                }
                description={
                  table.search || statusFilter !== "actif" || methodFilter !== "toutes"
                    ? "Ajuste la recherche, la méthode ou le statut."
                    : "Utilise le bouton « Nouvelle saisie » pour démarrer."
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
