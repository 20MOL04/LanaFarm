import type { ReportDocument } from "@/types/reports";

export interface ReportRepository {
  load(farmId: string): Promise<ReportDocument[]>;
  save(farmId: string, document: ReportDocument): Promise<void>;
  delete(farmId: string, id: string): Promise<void>;
}
