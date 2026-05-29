"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { AddProductionDialog } from "@/components/production/add-production-dialog";
import { SendStockDialog } from "@/components/production/send-stock-dialog";
import { ProductionKpis } from "@/components/production/production-kpis";
import { ProductionTable } from "@/components/production/production-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useModuleUrlFilters } from "@/hooks/use-module-url-filters";
import { useProductionsInRange } from "@/hooks/use-productions-in-range";
import { ACTION_LABEL } from "@/lib/terminology";
import type { Production } from "@/types/domain";

/**
 * Composition racine du module Production.
 * Le FarmStoreProvider est hissé au niveau du layout (app)/, ce qui permet
 * aux modules (Production, Ventes, Dashboard, Rapports…) de partager
 * leurs données et de respecter le verrouillage de semaine commun.
 */
export function ProductionModule() {
  return <ProductionModuleContent />;
}

function ProductionModuleContent() {
  const productions = useProductionsInRange();
  const [open, setOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<Production | null>(null);
  const [sendStockOpen, setSendStockOpen] = React.useState(false);
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

  // Auto-ouverture si on arrive depuis "/production?action=ajouter"
  React.useEffect(() => {
    if (searchParams.get("action") === "ajouter") {
      setEditingEntry(null);
      setOpen(true);
    }
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title="Production"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setSendStockOpen(true)}>
              <ArrowRight className="h-4 w-4" />
              {ACTION_LABEL.envoyerEnVente}
            </Button>
            <Button variant="accent" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Nouvelle saisie
            </Button>
          </div>
        }
      />

      <ProductionKpis />

      <ProductionTable
        data={productions}
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

      <AddProductionDialog
        open={open}
        onOpenChange={handleDialogOpenChange}
        editEntry={editingEntry}
      />

      <SendStockDialog open={sendStockOpen} onOpenChange={setSendStockOpen} />
    </>
  );
}
