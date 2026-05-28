"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { AddSaleDialog } from "@/components/sales/add-sale-dialog";
import { SalesKpis } from "@/components/sales/sales-kpis";
import { SalesTable } from "@/components/sales/sales-table";
import { PageHeader } from "@/components/shared/page-header";
import { ReceptionsPanel } from "@/components/transfers/receptions-panel";
import { Button } from "@/components/ui/button";
import { useModuleUrlFilters } from "@/hooks/use-module-url-filters";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import { useSalesInRange } from "@/hooks/use-sales-in-range";
import type { Vente } from "@/types/domain";

/**
 * Module Ventes — racine.
 * Consomme automatiquement les productions de la même plage pour calculer
 * le reçu ferme et le reste vente. Le FarmStoreProvider est hissé dans
 * le layout (app)/, partagé avec le module Production.
 */
export function SalesModule() {
  const ventes = useSalesInRange();
  const productions = useProductionsInRange();
  const [open, setOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<Vente | null>(null);
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
    if (searchParams.get("focus") === "receptions") {
      document.getElementById("receptions-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title="Ventes"
        actions={
          <Button variant="accent" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Ventes du jour
          </Button>
        }
      />

      <SalesKpis />

      <ReceptionsPanel />

      <SalesTable
        data={ventes}
        initialStatut={urlFilters.statut}
        initialJour={urlFilters.jour}
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

      <AddSaleDialog
        open={open}
        onOpenChange={handleDialogOpenChange}
        editEntry={editingEntry}
      />
    </>
  );
}
