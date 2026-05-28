"use client";

import * as React from "react";

import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODULE_LABEL, TYPE_LABEL } from "@/lib/action-display";
import type { ModuleFilter, TypeFilter } from "@/lib/history-calc";
import type { ActionType, Module } from "@/types/domain";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  module: ModuleFilter;
  onModuleChange: (v: ModuleFilter) => void;
  type: TypeFilter;
  onTypeChange: (v: TypeFilter) => void;
};

const MODULES: Module[] = [
  "production",
  "vente",
  "depense",
  "tresorerie",
  "transfert",
  "semaine",
];
const TYPES: ActionType[] = [
  "creation",
  "modification",
  "annulation",
  "restauration",
  "validation",
  "reouverture",
  "archivage",
];

export function HistoryFilters({
  search,
  onSearchChange,
  module,
  onModuleChange,
  type,
  onTypeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onValueChange={onSearchChange}
        placeholder="Rechercher dans les descriptions…"
      />
      <div className="flex flex-wrap gap-2">
        <Select
          value={module}
          onValueChange={(v) => onModuleChange(v as ModuleFilter)}
        >
          <SelectTrigger className="h-10 w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {MODULE_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => onTypeChange(v as TypeFilter)}
        >
          <SelectTrigger className="h-10 w-44">
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
