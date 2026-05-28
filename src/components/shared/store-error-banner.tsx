"use client";

import type { FarmStoreError } from "@/contexts/farm-store";
import { getStoreErrorMessage } from "@/lib/store-error-messages";
import { cn } from "@/lib/utils";

type Props = {
  error: FarmStoreError | null;
  className?: string;
};

/** Message d'erreur store — sous le formulaire, dialog reste ouvert. */
export function StoreErrorBanner({ error, className }: Props) {
  if (!error) return null;

  return (
    <p
      role="alert"
      className={cn("text-sm font-medium text-danger", className)}
    >
      {getStoreErrorMessage(error.code, error.message)}
    </p>
  );
}
