import { isFarmDataRemote } from "@/lib/farm-id";

import { apiReportRepository } from "./api-report-repository";
import { localReportRepository } from "./local-report-repository";
import type { ReportRepository } from "./report-repository";

export function getReportRepository(): ReportRepository {
  if (isFarmDataRemote()) {
    return apiReportRepository;
  }
  return localReportRepository;
}
