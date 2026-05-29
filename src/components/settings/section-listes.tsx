"use client";

import * as React from "react";
import { ListChecks, Plus } from "lucide-react";

import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { EditableListRow } from "@/components/settings/editable-list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfigStore } from "@/contexts/farm-store";
import {
  getCategorieConfigLabel,
  getMethodeConfigLabel,
} from "@/lib/config-defaults";
import { findClosestMatch } from "@/lib/fuzzy-match";

export function SectionListes() {
  const {
    config,
    updateCategorie,
    addCategorie,
    toggleCategorie,
    updateMethode,
    addMethode,
    toggleMethode,
    storeError,
    clearStoreError,
  } = useConfigStore();

  const categories = config.listes.categoriesDepense;
  const methodes = config.listes.methodesPaiement;

  return (
    <SectionCard>
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted" />
            Listes métier
          </span>
        }
      />
      <SectionBody className="grid gap-6 lg:grid-cols-2">
        <ListColumn
          title="Catégories de dépense"
          description="Désactiver une catégorie la masque lors de la saisie des dépenses."
        >
          <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {categories.map((item) => (
              <EditableListRow
                key={item.id}
                label={getCategorieConfigLabel(item)}
                actif={item.actif}
                canRename={item.isDefault}
                onRename={
                  item.isDefault
                    ? (next) => updateCategorie(item.id, { label: next })
                    : undefined
                }
                onToggle={() => toggleCategorie(item.id)}
              />
            ))}
          </ul>
          <AddCategorieForm
            existingLabels={categories.map((c) => getCategorieConfigLabel(c))}
            onAdd={addCategorie}
            errorMessage={
              storeError?.code === "CATEGORIE_EXISTE" ? storeError.message : undefined
            }
            onClearError={clearStoreError}
          />
        </ListColumn>

        <ListColumn
          title="Méthodes de paiement"
          description="Désactiver une méthode la masque lors des saisies."
        >
          <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {methodes.map((item) => (
              <EditableListRow
                key={item.id}
                label={getMethodeConfigLabel(item)}
                actif={item.actif}
                canRename={item.isDefault}
                onRename={
                  item.isDefault
                    ? (next) => updateMethode(item.id, { label: next })
                    : undefined
                }
                onToggle={() => toggleMethode(item.id)}
              />
            ))}
          </ul>
          <AddMethodeForm
            existingLabels={methodes.map((m) => getMethodeConfigLabel(m))}
            onAdd={addMethode}
            errorMessage={
              storeError?.code === "METHODE_EXISTE" ? storeError.message : undefined
            }
            onClearError={clearStoreError}
          />
        </ListColumn>
      </SectionBody>
    </SectionCard>
  );
}

function AddMethodeForm({
  existingLabels,
  onAdd,
  errorMessage,
  onClearError,
}: {
  existingLabels: string[];
  onAdd: (label: string) => void;
  errorMessage?: string;
  onClearError: () => void;
}) {
  const [newLabel, setNewLabel] = React.useState("");

  const commit = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onClearError();
    const match = findClosestMatch(trimmed, existingLabels);
    if (match) return;
    onAdd(trimmed);
    setNewLabel("");
  };

  const trimmed = newLabel.trim();
  const duplicate = trimmed ? findClosestMatch(trimmed, existingLabels) : null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => {
            onClearError();
            setNewLabel(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Nouvelle méthode…"
          className="h-9"
        />
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={commit}
          disabled={trimmed.length === 0 || !!duplicate}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>
      {duplicate ? (
        <p className="text-label text-muted">Cette méthode existe déjà.</p>
      ) : null}
      {errorMessage ? (
        <p className="text-label text-danger">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function AddCategorieForm({
  existingLabels,
  onAdd,
  errorMessage,
  onClearError,
}: {
  existingLabels: string[];
  onAdd: (label: string) => void;
  errorMessage?: string;
  onClearError: () => void;
}) {
  const [newLabel, setNewLabel] = React.useState("");

  const commit = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onClearError();
    const match = findClosestMatch(trimmed, existingLabels);
    if (match) return;
    onAdd(trimmed);
    setNewLabel("");
  };

  const trimmed = newLabel.trim();
  const duplicate = trimmed ? findClosestMatch(trimmed, existingLabels) : null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => {
            onClearError();
            setNewLabel(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Nouvelle catégorie…"
          className="h-9"
        />
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={commit}
          disabled={trimmed.length === 0 || !!duplicate}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>
      {duplicate ? (
        <p className="text-label text-muted">
          Cette catégorie existe déjà.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="text-label text-danger">{errorMessage}</p>
      ) : null}
    </div>
  );
}

function ListColumn({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-label text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
