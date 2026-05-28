/**
 * Service Rapports — requêtes Supabase (`farm_reports`).
 *
 * SQL cible :
 *   select * from farm_reports where farm_id = $1 order by generated_at desc limit 10;
 *   insert into farm_reports (...) values (...);
 */

import type { ReportDocument } from "@/types/reports";
import type { FarmReportRow } from "@/types/supabase-schema";

export async function fetchReports(
  _farmId: string,
  _limit = 10
): Promise<FarmReportRow[]> {
  return [];
}

export async function insertReport(
  _farmId: string,
  _row: FarmReportRow
): Promise<void> {}

export async function deleteReport(
  _farmId: string,
  _id: string
): Promise<void> {}

export type { ReportDocument };
