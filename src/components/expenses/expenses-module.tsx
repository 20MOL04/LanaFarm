"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { ExpensesKpis } from "@/components/expenses/expenses-kpis";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useModuleUrlFilters } from "@/hooks/use-module-url-filters";
import { useExpensesInRange } from "@/hooks/use-expenses-in-range";
import type { Depense } from "@/types/domain";

/**
 * Module Dépenses — racine.
 * Branché au FarmStoreProvider (layout (app)/) → partage état & verrou avec
 * les modules Production / Ventes.
 */
export function ExpensesModule() {
  const depenses = useExpensesInRange();
  const [open, setOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<Depense | null>(null);
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
        title="Dépenses"
        actions={
          <Button variant="accent" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Nouvelle dépense
          </Button>
        }
      />

      <ExpensesKpis />

      <ExpensesTable
        data={depenses}
        initialStatut={urlFilters.statut}
        initialJour={urlFilters.jour}
        initialCategorie={urlFilters.categorie}
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

      <AddExpenseDialog
        open={open}
        onOpenChange={handleDialogOpenChange}
        editEntry={editingEntry}
      />
    </>
  );
}
