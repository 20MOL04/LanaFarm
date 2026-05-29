"use client";

import * as React from "react";
import { Check, Eye, EyeOff, Pencil, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  /** Libellé effectif (override sinon défaut). */
  label: string;
  /** Activé ou désactivé (soft). */
  actif: boolean;
  /** Vrai si on peut renommer la ligne. */
  canRename?: boolean;
  /** Vrai si on peut basculer activé/désactivé. */
  canToggle?: boolean;
  /** Texte d'aide (ex : "id technique : aliments"). */
  hint?: string;
  onRename?: (next: string) => void;
  onToggle?: (next: boolean) => void;
};

/**
 * Ligne réutilisable pour les listes éditables.
 * Pattern unique pour catégories de dépense et méthodes de paiement.
 */
export function EditableListRow({
  label,
  actif,
  canRename = true,
  canToggle = true,
  hint,
  onRename,
  onToggle,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(label);

  React.useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || trimmed === label) {
      setEditing(false);
      setDraft(label);
      return;
    }
    onRename?.(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(label);
    setEditing(false);
  };

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2",
        !actif && "opacity-60"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className="h-8"
          />
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{label}</p>
            {hint ? (
              <p className="truncate text-label text-muted">{hint}</p>
            ) : null}
          </div>
        )}
        {!actif ? <Badge tone="outline">Désactivé</Badge> : null}
      </div>

      <div className="flex flex-none items-center gap-1">
        {editing ? (
          <>
            <Button type="button" size="icon-sm" variant="ghost" onClick={cancel} aria-label="Annuler">
              <X className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon-sm" variant="accent" onClick={commit} aria-label="Valider">
              <Check className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {canRename && onRename ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Renommer"
                title="Renommer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {canToggle && onToggle ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => onToggle(!actif)}
                aria-label={actif ? "Désactiver" : "Réactiver"}
                title={actif ? "Désactiver" : "Réactiver"}
              >
                {actif ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
