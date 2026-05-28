import { createId } from "@/lib/ids";
import type { ReportPayload, ReportType } from "@/lib/reports-calc";
import type { ReportDocument } from "@/types/reports";
import { DEFAULT_FARM_ID } from "@/types/reports";

export function createReportDocument(
  payload: ReportPayload,
  type: ReportType
): ReportDocument {
  return {
    id: createId(),
    farm_id: DEFAULT_FARM_ID,
    type,
    periodLabel: payload.periodLabel,
    fromISO: payload.fromISO,
    toISO: payload.toISO,
    generatedAt: payload.generatedAt,
    payload,
  };
}
