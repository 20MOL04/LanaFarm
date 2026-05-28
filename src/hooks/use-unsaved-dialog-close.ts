"use client";

import * as React from "react";

import type { ConfirmDialog } from "@/components/shared/confirm-dialog";

type ConfirmDialogProps = React.ComponentProps<typeof ConfirmDialog>;

export type UseUnsavedDialogCloseOptions = {
  open: boolean;
  isDirty: boolean;
  onOpenChange: (open: boolean) => void;
  /** Réinitialisation optionnelle du brouillon à l'abandon. */
  onDiscard?: () => void;
};

const CONFIRM_TITLE = "Modifications non enregistrées";
const CONFIRM_DESCRIPTION =
  "Vos changements seront perdus si vous quittez maintenant.";
const CONFIRM_STAY = "Rester";
const CONFIRM_LEAVE = "Quitter sans enregistrer";

/**
 * Bloque la fermeture d'un dialog formulaire si le brouillon est dirty.
 * Utiliser `closeWithoutConfirm` après un enregistrement réussi.
 */
export function useUnsavedDialogClose({
  open,
  isDirty,
  onOpenChange,
  onDiscard,
}: UseUnsavedDialogCloseOptions) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const bypassRef = React.useRef(false);

  React.useEffect(() => {
    if (open) bypassRef.current = false;
  }, [open]);

  const closeWithoutConfirm = React.useCallback(() => {
    bypassRef.current = true;
    setConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const requestClose = React.useCallback(() => {
    if (!open) return;
    if (bypassRef.current || !isDirty) {
      bypassRef.current = false;
      onOpenChange(false);
      return;
    }
    setConfirmOpen(true);
  }, [open, isDirty, onOpenChange]);

  const handleDialogOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true);
        return;
      }
      requestClose();
    },
    [onOpenChange, requestClose]
  );

  const handleConfirmDiscard = React.useCallback(() => {
    setConfirmOpen(false);
    onDiscard?.();
    bypassRef.current = true;
    onOpenChange(false);
  }, [onDiscard, onOpenChange]);

  const confirmDialogProps: ConfirmDialogProps = {
    open: confirmOpen,
    onOpenChange: setConfirmOpen,
    title: CONFIRM_TITLE,
    description: CONFIRM_DESCRIPTION,
    cancelLabel: CONFIRM_STAY,
    confirmLabel: CONFIRM_LEAVE,
    variant: "danger",
    onConfirm: handleConfirmDiscard,
  };

  return {
    requestClose,
    closeWithoutConfirm,
    dialogProps: {
      open,
      onOpenChange: handleDialogOpenChange,
    },
    confirmDialogProps,
  };
}
