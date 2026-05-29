"use client";

import * as React from "react";
import { History as HistoryIcon, UserRound } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { HistoryFilters } from "@/components/history/history-filters";
import {
  MODULE_ICON,
  MODULE_LABEL,
  TONE_BG_SOFT,
  TYPE_LABEL,
  TYPE_META,
  formatAbsoluteDateTimeFR,
  getActionUserLabel,
} from "@/lib/action-display";
import {
  applyHistoryFilters,
  type ModuleFilter,
  type TypeFilter,
} from "@/lib/history-calc";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { cn } from "@/lib/utils";
import type { ActionLog } from "@/types/domain";

type Props = {
  actions: ActionLog[];
  initialQ?: string | null;
};

export function HistoryTable({ actions, initialQ }: Props) {
  const [moduleFilter, setModuleFilter] = React.useState<ModuleFilter>("tous");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("tous");

  // Pré-filtre métier (avant la table) — réduit le travail du hook.
  const filteredByFacets = React.useMemo(
    () =>
      applyHistoryFilters(actions, {
        module: moduleFilter,
        type: typeFilter,
      }),
    [actions, moduleFilter, typeFilter]
  );

  const table = useDataTableState<ActionLog>({
    data: filteredByFacets,
    searchAccessors: [
      (a) => a.description,
      (a) => MODULE_LABEL[a.module],
      (a) => TYPE_LABEL[a.type],
      (a) => getActionUserLabel(a),
    ],
    sortAccessors: {
      date: (a) => new Date(a.dateISO),
      module: (a) => MODULE_LABEL[a.module],
      type: (a) => TYPE_LABEL[a.type],
      utilisateur: (a) => getActionUserLabel(a),
    },
    initialSort: { key: "date", direction: "desc" },
    pageSize: 15,
    initialSearch: initialQ,
  });

  const columns: DataTableColumn<ActionLog>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      primary: true,
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatAbsoluteDateTimeFR(row.dateISO)}
        </span>
      ),
    },
    {
      key: "module",
      header: "Module",
      sortable: true,
      cell: (row) => <ModulePill module={row.module} />,
    },
    {
      key: "type",
      header: "Action",
      sortable: true,
      cell: (row) => <ActionPill type={row.type} />,
    },
    {
      key: "description",
      header: "Résumé",
      cell: (row) => (
        <p className="max-w-md truncate text-sm text-foreground" title={row.description}>
          {row.description}
        </p>
      ),
    },
    {
      key: "utilisateur",
      header: "Utilisateur",
      sortable: true,
      cell: (row) => <UserPill label={getActionUserLabel(row)} />,
    },
  ];

  return (
    <SectionCard>
      <SectionHeader title="Journal" />
      <SectionBody className="space-y-4">
        <HistoryFilters
          search={table.search}
          onSearchChange={table.setSearch}
          module={moduleFilter}
          onModuleChange={setModuleFilter}
          type={typeFilter}
          onTypeChange={setTypeFilter}
        />

        <div className="w-full min-w-0 max-w-full rounded-card border border-border shadow-card">
          <DataTable<ActionLog>
            data={table.visible}
            columns={columns}
            rowKey={(a) => a.id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            emptyState={
              <EmptyState
                icon={HistoryIcon}
                title={
                  table.search || moduleFilter !== "tous" || typeFilter !== "tous"
                    ? "Aucune action ne correspond aux filtres"
                    : "Aucune action sur la période"
                }
                description={
                  table.search || moduleFilter !== "tous" || typeFilter !== "tous"
                    ? "Ajuste la recherche, le module ou le type."
                    : "Les opérations apparaîtront ici dès que tu effectueras une saisie."
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

/* ===========================================================
   Sous-composants — pills réutilisés dans les cellules
   =========================================================== */

function ModulePill({ module }: { module: ActionLog["module"] }) {
  const Icon = MODULE_ICON[module];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className="flex h-5 w-5 items-center justify-center rounded-pill bg-card-muted text-muted">
        <Icon className="h-3 w-3" />
      </span>
      {MODULE_LABEL[module]}
    </span>
  );
}

function ActionPill({ type }: { type: ActionLog["type"] }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      <Icon className="h-3 w-3" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

function UserPill({ label }: { label: string }) {
  const isSystem = label === "Système";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-label font-medium",
        isSystem ? TONE_BG_SOFT.info : "bg-card-muted text-foreground"
      )}
    >
      <UserRound className="h-3 w-3" />
      {label}
    </span>
  );
}
