import type { ReportDocument } from "@/types/reports";

import type { ReportRepository } from "./report-repository";

/** Stub — branchement via reports.service.ts + migration 00005. */
export const supabaseReportRepository: ReportRepository = {
  async load(_farmId) {
    return [];
  },
  async save(_farmId, _document) {},
  async delete(_farmId, _id) {},
};
