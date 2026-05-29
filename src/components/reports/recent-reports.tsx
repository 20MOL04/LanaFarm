"use client";

import * as React from "react";
import { Clock, Download, FileText, Printer, Trash2 } from "lucide-react";

import { ReportTypeBadge } from "@/components/reports/report-filters";
import { EmptyState } from "@/components/shared/empty-state";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import type { ReportType } from "@/lib/reports-calc";
import { cn } from "@/lib/utils";
import type { ReportDocument } from "@/types/reports";

export type { ReportType };

type Props = {
  items: ReportDocument[];
  activeId: string | null;
  onSelect: (doc: ReportDocument) => void;
  onExportExcel: (doc: ReportDocument) => void;
  onExportPdf: (doc: ReportDocument) => void;
  onPrint: (doc: ReportDocument) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
};

export function RecentReports({
  items,
  activeId,
  onSelect,
  onExportExcel,
  onExportPdf,
  onPrint,
  onDelete,
  onClear,
}: Props) {
  return (
    <SectionCard>
      <SectionHeader
        title="Rapports récents"
        actions={
          items.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Effacer tout
            </Button>
          ) : null
        }
      />
      <SectionBody>
        {items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun rapport généré"
            description='Choisis une période puis clique sur « Générer le rapport ». Le snapshot complet sera enregistré ici.'
          />
        ) : (
          <ul
            role="list"
            className="divide-y divide-border rounded-card border border-border shadow-card"
          >
            {items.map((doc) => (
              <RecentRow
                key={doc.id}
                doc={doc}
                active={doc.id === activeId}
                onSelect={onSelect}
                onExportExcel={onExportExcel}
                onExportPdf={onExportPdf}
                onPrint={onPrint}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </SectionBody>
    </SectionCard>
  );
}

function RecentRow({
  doc,
  active,
  onSelect,
  onExportExcel,
  onExportPdf,
  onPrint,
  onDelete,
}: {
  doc: ReportDocument;
  active: boolean;
  onSelect: (doc: ReportDocument) => void;
  onExportExcel: (doc: ReportDocument) => void;
  onExportPdf: (doc: ReportDocument) => void;
  onPrint: (doc: ReportDocument) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li
      className={cn(
        "px-3 py-2.5",
        active && "bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onSelect(doc)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-pill bg-card-muted text-muted">
            <Clock className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <ReportTypeBadge type={doc.type} />
              <span className="text-label text-muted">
                {formatRelative(doc.generatedAt)}
              </span>
            </span>
            <p className="mt-0.5 truncate text-sm text-foreground">
              {doc.periodLabel}
            </p>
          </span>
        </button>
        <div className="flex shrink-0 flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Exporter Excel"
            onClick={() => onExportExcel(doc)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Télécharger PDF"
            onClick={() => onExportPdf(doc)}
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Imprimer"
            onClick={() => onPrint(doc)}
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer"
            onClick={() => onDelete(doc.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 45) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.round(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.round(diffSec / 3600)} h`;
  const j = Math.round(diffSec / 86400);
  if (j < 7) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString("fr-GN", {
    day: "2-digit",
    month: "short",
  });
}
