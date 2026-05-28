import { localReportRepository } from "./local-report-repository";
import type { ReportRepository } from "./report-repository";
import { supabaseReportRepository } from "./supabase-report-repository";

export function getReportRepository(): ReportRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const remote = process.env.NEXT_PUBLIC_REPORTS_REMOTE === "true";
  if (url && remote) {
    return supabaseReportRepository;
  }
  return localReportRepository;
}
