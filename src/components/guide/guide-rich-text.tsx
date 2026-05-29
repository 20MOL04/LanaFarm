"use client";

import * as React from "react";

import {
  GUIDE_HIGHLIGHT_TERMS,
  type GuideHighlightKind,
} from "@/lib/user-guide/guide-highlight-patterns";
import { cn } from "@/lib/utils";

const HIGHLIGHT_CLASS: Record<GuideHighlightKind, string> = {
  page: "font-medium text-accent-blue",
  action:
    "rounded-sm bg-accent-blue/10 px-1.5 py-0.5 text-sm font-medium text-accent-blue",
  finance:
    "font-semibold underline decoration-accent-blue/40 underline-offset-2",
  kbd: "rounded-sm border border-border bg-card-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
};

const SORTED_TERMS = [...GUIDE_HIGHLIGHT_TERMS].sort(
  (a, b) => b.text.length - a.text.length
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERM_REGEX = new RegExp(
  `(${SORTED_TERMS.map((t) => escapeRegExp(t.text)).join("|")})`,
  "gi"
);

function kindForMatch(matched: string): GuideHighlightKind | null {
  const lower = matched.toLowerCase();
  const term = SORTED_TERMS.find((t) => t.text.toLowerCase() === lower);
  return term?.kind ?? null;
}

function renderHighlightedText(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(TERM_REGEX).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    const kind = kindForMatch(part);
    if (!kind) {
      return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
    }
    if (kind === "kbd") {
      return (
        <kbd key={`${keyPrefix}-${index}`} className={HIGHLIGHT_CLASS.kbd}>
          {part}
        </kbd>
      );
    }
    return (
      <span key={`${keyPrefix}-${index}`} className={HIGHLIGHT_CLASS[kind]}>
        {part}
      </span>
    );
  });
}

const WARNING_SPLIT = /(?=Si vous essayez)/i;

type Segment = { type: "text"; text: string } | { type: "warning"; text: string };

export function splitGuideWarningSegments(text: string): Segment[] {
  const chunks = text.split(WARNING_SPLIT).filter((c) => c.trim().length > 0);
  if (chunks.length <= 1) {
    return [{ type: "text", text }];
  }
  return chunks.map((chunk) =>
    /^Si vous essayez/i.test(chunk)
      ? { type: "warning", text: chunk.trim() }
      : { type: "text", text: chunk.trim() }
  );
}

type RichTextProps = {
  text: string;
  as?: "span" | "p";
  className?: string;
};

/** Texte du guide avec mots clés et callouts d'avertissement. */
export function GuideRichText({ text, as = "span", className }: RichTextProps) {
  const segments = splitGuideWarningSegments(text);
  const hasWarning = segments.some((s) => s.type === "warning");

  const renderSegment = (segment: Segment, segIndex: number) => {
    if (segment.type === "warning") {
      return (
        <div
          key={`warn-${segIndex}`}
          className={cn(
            "rounded-card border border-warning/40 border-l-2 border-l-warning",
            "bg-warning-soft/50 px-4 py-3 text-body leading-relaxed text-foreground"
          )}
        >
          {renderHighlightedText(segment.text, `w-${segIndex}`)}
        </div>
      );
    }
    const content = renderHighlightedText(segment.text, `t-${segIndex}`);
    if (as === "p" && hasWarning) {
      return (
        <p key={`t-${segIndex}`} className={className}>
          {content}
        </p>
      );
    }
    return (
      <React.Fragment key={`t-${segIndex}`}>
        {segIndex > 0 && !hasWarning ? " " : null}
        {content}
      </React.Fragment>
    );
  };

  if (as === "p" && hasWarning) {
    return <div className={cn("space-y-2", className)}>{segments.map(renderSegment)}</div>;
  }

  if (as === "p") {
    return <p className={className}>{segments.map(renderSegment)}</p>;
  }

  return <span className={className}>{segments.map(renderSegment)}</span>;
}
