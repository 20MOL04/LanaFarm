/**
 * Modèle domaine — rapports (générateur, Excel, PDF, historique).
 */

import type {
  ReportPayload,
  ReportType,
} from "@/lib/reports-calc";

export type { ReportPayload, ReportType };

import { getPublicFarmId } from "@/lib/farm-id";

export const DEFAULT_FARM_ID = getPublicFarmId();

export type ReportDocument = {
  id: string;
  farm_id: string;
  type: ReportType;
  periodLabel: string;
  fromISO: string;
  toISO: string;
  generatedAt: string;
  payload: ReportPayload;
  createdBy?: string;
};
