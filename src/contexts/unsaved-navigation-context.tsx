"use client";

import * as React from "react";

import { UnsavedChangesConfirm } from "@/components/shared/unsaved-changes-confirm";

type UnsavedNavigationContextValue = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  /** Exécute l'action ou ouvre la confirmation si le brouillon est dirty. */
  guardNavigation: (action: () => void) => void;
};

const UnsavedNavigationContext =
  React.createContext<UnsavedNavigationContextValue | null>(null);

export function UnsavedNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  const guardNavigation = React.useCallback(
    (action: () => void) => {
      if (!hasUnsavedChanges) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setConfirmOpen(true);
    },
    [hasUnsavedChanges]
  );

  const handleConfirmDiscard = React.useCallback(() => {
    setConfirmOpen(false);
    setHasUnsavedChanges(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  React.useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  const value = React.useMemo(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges,
      guardNavigation,
    }),
    [hasUnsavedChanges, guardNavigation]
  );

  return (
    <UnsavedNavigationContext.Provider value={value}>
      {children}
      <UnsavedChangesConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Modifications non enregistrées"
        description="Vos changements seront perdus si vous quittez maintenant."
        cancelLabel="Rester"
        confirmLabel="Quitter sans enregistrer"
        variant="danger"
        onConfirm={handleConfirmDiscard}
      />
    </UnsavedNavigationContext.Provider>
  );
}

export function useUnsavedNavigation(): UnsavedNavigationContextValue {
  const ctx = React.useContext(UnsavedNavigationContext);
  if (!ctx) {
    throw new Error(
      "useUnsavedNavigation doit être utilisé dans UnsavedNavigationProvider"
    );
  }
  return ctx;
}

/** Enregistre un formulaire pleine page (ex. section Paramètres). */
export function useRegisterUnsavedChanges(isDirty: boolean) {
  const { setHasUnsavedChanges } = useUnsavedNavigation();

  React.useEffect(() => {
    setHasUnsavedChanges(isDirty);
    return () => setHasUnsavedChanges(false);
  }, [isDirty, setHasUnsavedChanges]);
}
