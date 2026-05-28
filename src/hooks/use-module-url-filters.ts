"use client";

import { useSearchParams } from "next/navigation";

import type { EntreeStatut } from "@/types/domain";

const VALID_STATUTS: EntreeStatut[] = ["actif", "annule", "archive"];

export type ModuleUrlFilters = {
  jour: string | null;
  statut: EntreeStatut | null;
  focus: string | null;
  action: string | null;
  section: string | null;
  categorie: string | null;
};

/** Lit les query params deep-link (contrat cahier notifications v2). */
export function useModuleUrlFilters(): ModuleUrlFilters {
  const searchParams = useSearchParams();
  const statutRaw = searchParams.get("statut");
  const statut =
    statutRaw && VALID_STATUTS.includes(statutRaw as EntreeStatut)
      ? (statutRaw as EntreeStatut)
      : null;

  return {
    jour: searchParams.get("jour"),
    statut,
    focus: searchParams.get("focus"),
    action: searchParams.get("action"),
    section: searchParams.get("section"),
    categorie: searchParams.get("categorie"),
  };
}
