import type { ReportDocument } from "@/types/reports";

import type { ReportRepository } from "./report-repository";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API reports ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiReportRepository: ReportRepository = {
  async load(_farmId) {
    const data = await parseJson<{ items: ReportDocument[] }>(
      await fetch("/api/farm/reports", { credentials: "include" })
    );
    return data.items ?? [];
  },

  async save(_farmId, document) {
    await parseJson(
      await fetch("/api/farm/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      })
    );
  },

  async delete(_farmId, id) {
    await parseJson(
      await fetch(`/api/farm/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
    );
  },
};
