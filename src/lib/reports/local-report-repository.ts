import type { ReportDocument } from "@/types/reports";

import type { ReportRepository } from "./report-repository";

const STORAGE_KEY = "lanafarm-reports-v1";
const MAX_KEEP = 10;

type StoredPayload = {
  farmId: string;
  items: ReportDocument[];
};

function readAll(): StoredPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(payloads: StoredPayload[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payloads));
}

export const localReportRepository: ReportRepository = {
  async load(farmId) {
    const all = readAll();
    return all.find((p) => p.farmId === farmId)?.items ?? [];
  },

  async save(farmId, document) {
    const existing = await localReportRepository.load(farmId);
    const next = [document, ...existing.filter((d) => d.id !== document.id)].slice(
      0,
      MAX_KEEP
    );
    const all = readAll().filter((p) => p.farmId !== farmId);
    all.push({ farmId, items: next });
    writeAll(all);
  },

  async delete(farmId, id) {
    const existing = await localReportRepository.load(farmId);
    const next = existing.filter((d) => d.id !== id);
    const all = readAll().filter((p) => p.farmId !== farmId);
    all.push({ farmId, items: next });
    writeAll(all);
  },
};
