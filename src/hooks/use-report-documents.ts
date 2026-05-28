"use client";

import * as React from "react";

import { getReportRepository } from "@/lib/reports/report-storage";
import type { ReportDocument } from "@/types/reports";
import { DEFAULT_FARM_ID } from "@/types/reports";

export function useReportDocuments() {
  const [items, setItems] = React.useState<ReportDocument[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const repo = React.useMemo(() => getReportRepository(), []);

  React.useEffect(() => {
    let cancelled = false;
    void repo.load(DEFAULT_FARM_ID).then((docs) => {
      if (cancelled) return;
      setItems(docs);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const save = React.useCallback(
    async (document: ReportDocument) => {
      await repo.save(DEFAULT_FARM_ID, document);
      const docs = await repo.load(DEFAULT_FARM_ID);
      setItems(docs);
      return document;
    },
    [repo]
  );

  const remove = React.useCallback(
    async (id: string) => {
      await repo.delete(DEFAULT_FARM_ID, id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    },
    [repo]
  );

  const clear = React.useCallback(async () => {
    for (const d of items) {
      await repo.delete(DEFAULT_FARM_ID, d.id);
    }
    setItems([]);
  }, [items, repo]);

  return { items, hydrated, save, remove, clear };
}
