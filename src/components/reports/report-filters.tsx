"use client";

import * as React from "react";
import {
  CalendarDays,
  FileDown,
  FileText,
  Printer,
  Save,
  Sheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { useDateRange } from "@/contexts/date-range-context";
import { formatRange } from "@/lib/date-ranges";
import type { DateRangePresetId } from "@/lib/date-ranges";
import type { ReportType } from "@/lib/reports-calc";
import { cn } from "@/lib/utils";

type Props = {
  onGenerate: (type: ReportType) => void;
  onPrint: () => void;
  onExcel: () => void;
  onPdf: () => void;
  archivedMode?: boolean;
};

const QUICK_PERIODS: { id: DateRangePresetId; label: string }[] = [
  { id: "this-week", label: "Cette semaine" },
  { id: "this-month", label: "Ce mois" },
  { id: "last-7", label: "7 jours" },
  { id: "last-30", label: "30 jours" },
  { id: "last-90", label: "90 jours" },
];

export function ReportFilters({
  onGenerate,
  onPrint,
  onExcel,
  onPdf,
  archivedMode,
}: Props) {
  const { range, presetId, setPreset } = useDateRange();

  const reportType: ReportType =
    presetId === "this-week"
      ? "weekly"
      : presetId === "this-month"
        ? "monthly"
        : "custom";

  return (
    <SectionCard>
      <SectionHeader
        title="Filtres"
        actions={
          <span className="hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatRange(range)}
            {archivedMode ? " · archivé" : null}
          </span>
        }
      />
      <SectionBody>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-button bg-card-muted p-1">
            {QUICK_PERIODS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={presetId === p.id ? "primary" : "ghost"}
                onClick={() => setPreset(p.id)}
                className={cn(
                  "h-7 px-3 text-xs",
                  presetId !== p.id && "text-muted hover:text-foreground"
                )}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExcel}>
              <Sheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onPdf}>
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => onGenerate(reportType)}
            >
              <Save className="h-4 w-4" />
              Générer le rapport
            </Button>
          </div>
        </div>
      </SectionBody>
    </SectionCard>
  );
}

export function ReportTypeBadge({ type }: { type: ReportType }) {
  const meta: Record<
    ReportType,
    { label: string; tone: string; icon: React.ElementType }
  > = {
    weekly: {
      label: "Hebdomadaire",
      tone: "bg-accent-blue-soft text-accent-blue",
      icon: FileText,
    },
    monthly: {
      label: "Mensuel",
      tone: "bg-info-soft text-info",
      icon: FileDown,
    },
    custom: {
      label: "Personnalisé",
      tone: "bg-card-muted text-foreground",
      icon: CalendarDays,
    },
  };
  const m = meta[type];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
        m.tone
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}
