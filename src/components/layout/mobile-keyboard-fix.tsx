"use client";

import * as React from "react";

/**
 * Corrige le viewport mobile après fermeture du clavier (iOS / Android).
 * Met à jour --vvh et remet le scroll en place quand un champ perd le focus.
 */
export function MobileKeyboardFix() {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const syncViewport = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };

    syncViewport();
    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);

    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }
      window.setTimeout(() => {
        syncViewport();
        const active = document.activeElement;
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement
        ) {
          return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    };

    document.addEventListener("focusout", onFocusOut);

    return () => {
      vv.removeEventListener("resize", syncViewport);
      vv.removeEventListener("scroll", syncViewport);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return null;
}
