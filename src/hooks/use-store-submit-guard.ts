"use client";

import * as React from "react";

import type { FarmStoreError } from "@/contexts/farm-store";

/**
 * Après dispatch store : ferme le dialog seulement si state.errors est null.
 * Le reducer met à jour errors de façon synchrone ; l'effet lit l'état du rendu suivant.
 */
export function useStoreSubmitGuard(
  errors: FarmStoreError | null,
  onSuccess: () => void
) {
  const [pending, setPending] = React.useState(false);

  const runSubmit = React.useCallback((action: () => void) => {
    setPending(true);
    action();
  }, []);

  React.useEffect(() => {
    if (!pending) return;
    setPending(false);
    if (errors) return;
    onSuccess();
  }, [pending, errors, onSuccess]);

  return runSubmit;
}
