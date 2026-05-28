"use client";

import * as React from "react";

/**
 * Hook utilitaire pour les sections du module Paramètres.
 *
 * Pattern :
 *   - on initialise un draft local avec la valeur du store
 *   - on détecte si le draft diffère du dernier sauvegardé (dirty)
 *   - on appelle `onSave(draft)` quand l'opérateur clique sur "Enregistrer"
 *   - on resync le draft si la valeur source change ailleurs (V2 multi-user)
 *
 * Garde la logique Save locale à chaque section — pas d'autosave V1.
 */
export function useSectionForm<T extends object>(
  value: T,
  options?: { /** Compare deep ou shallow — par défaut JSON. */ isEqual?: (a: T, b: T) => boolean }
) {
  const [draft, setDraft] = React.useState<T>(value);
  const lastSyncedRef = React.useRef<T>(value);

  React.useEffect(() => {
    // Resync si la valeur source change après un dispatch
    // (évite de réafficher une vieille version après save).
    if (!shallowEqualJSON(lastSyncedRef.current, value)) {
      setDraft(value);
      lastSyncedRef.current = value;
    }
  }, [value]);

  const isEqual = options?.isEqual ?? shallowEqualJSON;
  const isDirty = !isEqual(draft, value);

  const setField = React.useCallback(<K extends keyof T>(key: K, v: T[K]) => {
    setDraft((d) => ({ ...d, [key]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setDraft(value);
  }, [value]);

  return { draft, setDraft, setField, isDirty, reset };
}

function shallowEqualJSON<T>(a: T, b: T): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}
