import type { ReportDocument } from "@/types/reports";
import type { FarmReportRow } from "@/types/supabase-schema";
import type { ReportPayload } from "@/lib/reports-calc";

export function reportDocumentToRow(doc: ReportDocument): FarmReportRow {
  return {
    id: doc.id,
    farm_id: doc.farm_id,
    report_type: doc.type,
    period_label: doc.periodLabel,
    period_from: doc.fromISO,
    period_to: doc.toISO,
    payload_json: doc.payload as unknown as Record<string, unknown>,
    generated_at: doc.generatedAt,
    created_by: doc.createdBy ?? null,
  };
}

export function rowToReportDocument(row: FarmReportRow): ReportDocument {
  return {
    id: row.id,
    farm_id: row.farm_id,
    type: row.report_type as ReportDocument["type"],
    periodLabel: row.period_label,
    fromISO: row.period_from,
    toISO: row.period_to,
    generatedAt: row.generated_at,
    payload: row.payload_json as unknown as ReportPayload,
    createdBy: row.created_by ?? undefined,
  };
}
