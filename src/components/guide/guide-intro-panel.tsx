"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { GUIDE_INTRO } from "@/lib/user-guide/guide-content";

const PAGE_HIGHLIGHT = "font-medium text-accent-blue";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightOnlyTerms(text: string, terms: string[]): React.ReactNode[] {
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    const matched = terms.some((t) => t.toLowerCase() === part.toLowerCase());
    if (!matched) {
      return <React.Fragment key={index}>{part}</React.Fragment>;
    }
    return (
      <span key={index} className={PAGE_HIGHLIGHT}>
        {part}
      </span>
    );
  });
}

export function GuideIntroPanel() {
  const { intro } = GUIDE_INTRO;

  return (
    <div className="space-y-3 text-body leading-relaxed text-foreground">
      <p>
        Bienvenue dans <span className={PAGE_HIGHLIGHT}>LanaFarm</span>
      </p>

      <p>
        {highlightOnlyTerms(intro.appParagraph, [
          "Production",
          "ventes",
          "dépenses",
          "trésorerie",
        ])}
      </p>

      <p>{intro.guideParagraph}</p>

      <div className="space-y-2 pt-1">
        <p className="font-medium text-foreground">{intro.checklistTitle}</p>
        <ul className="space-y-2" role="list">
          {intro.checklistItems.map((item) => (
            <li key={item} className="flex gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
