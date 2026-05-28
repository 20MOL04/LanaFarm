import "server-only";

import { reportDocumentToRow, rowToReportDocument } from "@/lib/reports/report-mapper";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ReportDocument } from "@/types/reports";

const MAX_KEEP = 10;

export async function loadReports(farmId: string): Promise<ReportDocument[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("farm_reports")
    .select("*")
    .eq("farm_id", farmId)
    .order("generated_at", { ascending: false })
    .limit(MAX_KEEP);

  if (error) throw error;
  return (data ?? []).map(rowToReportDocument);
}

export async function saveReport(farmId: string, document: ReportDocument): Promise<void> {
  const existing = await loadReports(farmId);
  const merged = [document, ...existing.filter((d) => d.id !== document.id)].slice(0, MAX_KEEP);

  const { error: delErr } = await getSupabaseAdmin()
    .from("farm_reports")
    .delete()
    .eq("farm_id", farmId);
  if (delErr) throw delErr;

  if (merged.length === 0) return;

  const rows = merged.map((d) => ({
    ...reportDocumentToRow({ ...d, farm_id: farmId }),
    farm_id: farmId,
  }));
  const { error } = await getSupabaseAdmin().from("farm_reports").insert(rows);
  if (error) throw error;
}

export async function deleteReport(farmId: string, id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("farm_reports")
    .delete()
    .eq("farm_id", farmId)
    .eq("id", id);
  if (error) throw error;
}
