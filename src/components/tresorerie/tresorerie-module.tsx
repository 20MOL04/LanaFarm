"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { AddTresorerieDialog } from "@/components/tresorerie/add-tresorerie-dialog";
import { TresorerieKpis } from "@/components/tresorerie/tresorerie-kpis";
import { TresorerieTable } from "@/components/tresorerie/tresorerie-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useModuleUrlFilters } from "@/hooks/use-module-url-filters";
import { useTresorerieInRange } from "@/hooks/use-tresorerie-in-range";
import type { Tresorerie } from "@/types/domain";

/**
 * Module Trésorerie — racine.
 */
export function TresorerieModule() {
  const tresorerie = useTresorerieInRange();
  const [open, setOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<Tresorerie | null>(null);
  const searchParams = useSearchParams();
  const urlFilters = useModuleUrlFilters();

  const openAddDialog = () => {
    setEditingEntry(null);
    setOpen(true);
  };

  const handleDialogOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setEditingEntry(null);
  };

  React.useEffect(() => {
    if (searchParams.get("action") === "ajouter") {
      setEditingEntry(null);
      setOpen(true);
    }
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title="Trésorerie"
        actions={
          <Button variant="accent" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Nouvelle saisie
          </Button>
        }
      />

      <TresorerieKpis />

      <TresorerieTable
        data={tresorerie}
        initialStatut={urlFilters.statut}
        initialJour={urlFilters.jour}
        initialQ={urlFilters.q}
        onRequestEdit={(entry) => {
          setEditingEntry(entry);
          setOpen(true);
        }}
        headerActions={
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <AddTresorerieDialog
        open={open}
        onOpenChange={handleDialogOpenChange}
        editEntry={editingEntry}
      />
    </>
  );
}
