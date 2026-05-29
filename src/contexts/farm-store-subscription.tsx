"use client";

import * as React from "react";

import type { State } from "@/contexts/farm-store";

export type FarmStoreSubscription = {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => State;
};

const FarmStoreSubscriptionContext =
  React.createContext<FarmStoreSubscription | null>(null);

export function FarmStoreSubscriptionProvider({
  state,
  children,
}: {
  state: State;
  children: React.ReactNode;
}) {
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const listenersRef = React.useRef(new Set<() => void>());

  React.useEffect(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, [state]);

  const subscription = React.useMemo<FarmStoreSubscription>(
    () => ({
      getSnapshot: () => stateRef.current,
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    []
  );

  return (
    <FarmStoreSubscriptionContext.Provider value={subscription}>
      {children}
    </FarmStoreSubscriptionContext.Provider>
  );
}

/** Abonnement ciblé — évite le re-render global sur tout changement store. */
export function useFarmSelector<T>(selector: (state: State) => T): T {
  const subscription = React.useContext(FarmStoreSubscriptionContext);
  if (!subscription) {
    throw new Error("FarmStoreSubscriptionProvider manquant dans l'arbre React.");
  }

  const selectorRef = React.useRef(selector);
  selectorRef.current = selector;

  const cacheRef = React.useRef<{ hasValue: boolean; value: T }>({
    hasValue: false,
    value: undefined as T,
  });

  const getSelection = React.useCallback((): T => {
    const next = selectorRef.current(subscription.getSnapshot());
    if (
      cacheRef.current.hasValue &&
      Object.is(cacheRef.current.value, next)
    ) {
      return cacheRef.current.value;
    }
    cacheRef.current = { hasValue: true, value: next };
    return next;
  }, [subscription]);

  return React.useSyncExternalStore(
    subscription.subscribe,
    getSelection,
    getSelection
  );
}
