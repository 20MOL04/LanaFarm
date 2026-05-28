"use client";

import * as React from "react";

import {
  type DateRange,
  type DateRangePresetId,
  dateRangePresets,
  getPreset,
} from "@/lib/date-ranges";

type DateRangeContextValue = {
  range: DateRange;
  presetId: DateRangePresetId;
  setPreset: (id: DateRangePresetId) => void;
  setCustomRange: (range: DateRange) => void;
  presets: typeof dateRangePresets;
};

const DateRangeContext = React.createContext<DateRangeContextValue | null>(null);

const DEFAULT_PRESET: DateRangePresetId = "this-week";

export function DateRangeProvider({
  children,
  initialPreset = DEFAULT_PRESET,
}: {
  children: React.ReactNode;
  initialPreset?: DateRangePresetId;
}) {
  const [presetId, setPresetId] = React.useState<DateRangePresetId>(initialPreset);
  const [customRange, setCustomRangeState] = React.useState<DateRange | null>(null);

  const range = React.useMemo<DateRange>(() => {
    if (presetId === "custom" && customRange) return customRange;
    return getPreset(presetId).build();
  }, [presetId, customRange]);

  const setPreset = React.useCallback((id: DateRangePresetId) => {
    setPresetId(id);
    if (id !== "custom") setCustomRangeState(null);
  }, []);

  const setCustomRange = React.useCallback((next: DateRange) => {
    setCustomRangeState(next);
    setPresetId("custom");
  }, []);

  const value = React.useMemo<DateRangeContextValue>(
    () => ({
      range,
      presetId,
      setPreset,
      setCustomRange,
      presets: dateRangePresets,
    }),
    [range, presetId, setPreset, setCustomRange]
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRangeContextValue {
  const ctx = React.useContext(DateRangeContext);
  if (!ctx) {
    throw new Error(
      "useDateRange doit être utilisé à l'intérieur d'un <DateRangeProvider />."
    );
  }
  return ctx;
}
