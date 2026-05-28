"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ReportArchivedSummaries } from "@/components/reports/report-archived-summaries";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportFinancialSummary } from "@/components/reports/report-financial-summary";
import { ReportKpiSummary } from "@/components/reports/report-kpi-summary";
import { ReportOperationalTables } from "@/components/reports/report-operational-tables";
import { ReportPrintHeader } from "@/components/reports/report-print-header";
import { ReportPrintTimeline } from "@/components/reports/report-print-timeline";
import { RecentReports } from "@/components/reports/recent-reports";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDateRange } from "@/contexts/date-range-context";
import {
  useTresorerieStore,
  useExpensesStore,
  useFarmConfig,
  useProductionStore,
  useSalesStore,
  useTransfersStore,
} from "@/contexts/farm-store";
import { useReportDocuments } from "@/hooks/use-report-documents";
import { useTresorerieInRange } from "@/hooks/use-tresorerie-in-range";
import { useExpensesInRange } from "@/hooks/use-expenses-in-range";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import { useSalesInRange } from "@/hooks/use-sales-in-range";
import { useTransfersInRange } from "@/hooks/use-transfers-in-range";
import { buildActivityTimeline } from "@/lib/dashboard-calc";
import { formatRange } from "@/lib/date-ranges";
import { createReportDocument } from "@/lib/reports/create-report-document";
import { exportReportToExcel } from "@/lib/reports/report-excel";
import { downloadReportPdf } from "@/lib/reports/report-pdf";
import {
  buildReportPayload,
  buildReportSnapshot,
  type ReportPayload,
  type ReportType,
} from "@/lib/reports-calc";
import type { ReportDocument } from "@/types/reports";

export function ReportsModule() {
  const { range, presetId, setCustomRange } = useDateRange();
  const config = useFarmConfig();
  const searchParams = useSearchParams();

  const productions = useProductionsInRange();
  const ventes = useSalesInRange();
  const depenses = useExpensesInRange();
  const tresorerie = useTresorerieInRange();
  const transfertsInRange = useTransfersInRange();

  const { state: prodState } = useProductionStore();
  const { state: salesState } = useSalesStore();
  const { state: expState } = useExpensesStore();
  const { state: tresorerieState } = useTresorerieStore();
  const { getAllTransfers } = useTransfersStore();
  const allTransferts = getAllTransfers();

  const { items: recent, save, remove, clear } = useReportDocuments();
  const [archivedDoc, setArchivedDoc] = React.useState<ReportDocument | null>(
    null
  );

  const cap = config.preferences.capacitePlateau;

  const liveSnapshot = React.useMemo(
    () =>
      buildReportSnapshot({
        productionsInRange: productions,
        ventesInRange: ventes,
        depensesInRange: depenses,
        tresorerieInRange: tresorerie,
        allProductions: prodState.productions,
        allTresorerie: tresorerieState.tresorerie,
        allTransferts,
        allVentes: salesState.ventes,
        allDepenses: expState.depenses,
        rangeStart: range.from,
        rangeEnd: range.to,
        capacitePlateau: cap,
        config,
      }),
    [
      productions,
      ventes,
      depenses,
      tresorerie,
      prodState.productions,
      tresorerieState.tresorerie,
      allTransferts,
      salesState.ventes,
      expState.depenses,
      range.from,
      range.to,
      cap,
      config,
    ]
  );

  const liveTimeline = React.useMemo(
    () =>
      buildActivityTimeline(range.from, range.to, productions, ventes, depenses, cap),
    [range, productions, ventes, depenses, cap]
  );

  const buildLivePayload = React.useCallback(
    (type: ReportType): ReportPayload =>
      buildReportPayload({
        snapshot: liveSnapshot,
        productions,
        ventes,
        depenses,
        tresorerie,
        transferts: transfertsInRange,
        farm: config.profil,
        config,
        capacitePlateau: cap,
        rangeStart: range.from,
        rangeEnd: range.to,
        fromISO: range.from.toISOString(),
        toISO: range.to.toISOString(),
        periodLabel: formatRange(range),
        type,
        timeline: liveTimeline,
      }),
    [
      liveSnapshot,
      productions,
      ventes,
      depenses,
      tresorerie,
      transfertsInRange,
      config,
      cap,
      range,
      liveTimeline,
    ]
  );

  const displayPayload = archivedDoc?.payload ?? null;
  const snapshot = displayPayload?.kpis ?? liveSnapshot;
  const timeline = displayPayload?.timeline ?? liveTimeline;
  const periodLabel = displayPayload?.periodLabel ?? formatRange(range);
  const farmProfil = displayPayload?.farm ?? config.profil;

  const exportPayload = React.useCallback((): ReportPayload => {
    if (archivedDoc) return archivedDoc.payload;
    const type: ReportType =
      presetId === "this-week"
        ? "weekly"
        : presetId === "this-month"
          ? "monthly"
          : "custom";
    return buildLivePayload(type);
  }, [archivedDoc, buildLivePayload, presetId]);

  const handleGenerate = React.useCallback(
    async (type: ReportType) => {
      const payload = buildLivePayload(type);
      const doc = createReportDocument(payload, type);
      await save(doc);
      setArchivedDoc(null);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [buildLivePayload, save]
  );

  const handleSelectArchived = React.useCallback(
    (doc: ReportDocument) => {
      setArchivedDoc(doc);
      setCustomRange({
        from: new Date(doc.fromISO),
        to: new Date(doc.toISO),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCustomRange]
  );

  const handleClearArchived = React.useCallback(() => {
    setArchivedDoc(null);
  }, []);

  React.useEffect(() => {
    const reportId = searchParams.get("reportId");
    if (!reportId) return;
    const found = recent.find((d) => d.id === reportId);
    if (found) handleSelectArchived(found);
  }, [searchParams, recent, handleSelectArchived]);

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <PageHeader
        title="Rapports"
        actions={
          <Badge tone="outline">
            {presetId === "this-week"
              ? "Hebdomadaire"
              : presetId === "this-month"
                ? "Mensuel"
                : "Personnalisé"}
            {" · "}
            {periodLabel}
          </Badge>
        }
      />

      {archivedDoc ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-muted/20 px-3 py-2 text-sm print:hidden">
          <span>
            Rapport archivé du{" "}
            {new Date(archivedDoc.generatedAt).toLocaleString("fr-GN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <Button variant="outline" size="sm" onClick={handleClearArchived}>
            Revenir au live
          </Button>
        </div>
      ) : null}

      <ReportFilters
        archivedMode={!!archivedDoc}
        onGenerate={handleGenerate}
        onPrint={handlePrint}
        onExcel={() => exportReportToExcel(exportPayload())}
        onPdf={() => downloadReportPdf(exportPayload())}
      />

      <div id="print-zone" className="space-y-4 print:space-y-4">
        <ReportPrintHeader
          periodLabel={periodLabel}
          generatedAt={
            displayPayload?.generatedAt
              ? new Date(displayPayload.generatedAt)
              : new Date()
          }
          ville={farmProfil.ville}
          telephone={farmProfil.telephone}
        />

        <ReportKpiSummary snapshot={snapshot} />
        <ReportFinancialSummary snapshot={snapshot} />

        <div className="print:break-before-page">
          <div className="print:hidden">
            <ActivityChart data={timeline} />
          </div>
          <ReportPrintTimeline data={timeline} />
        </div>

        {archivedDoc ? (
          <ReportArchivedSummaries payload={archivedDoc.payload} />
        ) : (
          <ReportOperationalTables
            productions={productions}
            ventes={ventes}
            depenses={depenses}
            tresorerie={tresorerie}
          />
        )}
      </div>

      <div className="print:hidden">
        <RecentReports
          items={recent}
          activeId={archivedDoc?.id ?? null}
          onSelect={handleSelectArchived}
          onExportExcel={(doc) => exportReportToExcel(doc.payload)}
          onExportPdf={(doc) => downloadReportPdf(doc.payload)}
          onPrint={(doc) => {
            setArchivedDoc(doc);
            setCustomRange({
              from: new Date(doc.fromISO),
              to: new Date(doc.toISO),
            });
            window.setTimeout(() => window.print(), 150);
          }}
          onDelete={async (id) => {
            await remove(id);
            if (archivedDoc?.id === id) setArchivedDoc(null);
          }}
          onClear={clear}
        />
      </div>
    </>
  );
}
