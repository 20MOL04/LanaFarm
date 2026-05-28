"use client";

import { site } from "@/config/site";
import { formatTextForExport } from "@/lib/format-export";

type Props = {
  periodLabel: string;
  generatedAt: Date;
  ville?: string;
  telephone?: string;
};

/** En-tête A4 — visible uniquement à l'impression. */
export function ReportPrintHeader({
  periodLabel,
  generatedAt,
  ville,
  telephone,
}: Props) {
  const contact = [ville, telephone]
    .filter((s) => s && s.trim().length > 0)
    .join(" · ");

  return (
    <header className="mb-5 hidden border-b border-border pb-4 print:block">
      <h1 className="text-[28pt] font-bold leading-none tracking-tight text-accent-blue">
        {site.name}
      </h1>
      <p className="mt-2 text-[12pt] font-semibold text-foreground">
        Rapport — {formatTextForExport(periodLabel)}
      </p>
      {contact ? (
        <p className="mt-1 text-[9pt] text-muted">{contact}</p>
      ) : null}
      <p className="mt-1 text-[9pt] text-muted">
        Genere le{" "}
        {generatedAt.toLocaleString("fr-FR", {
          dateStyle: "long",
          timeStyle: "short",
        })}
      </p>
    </header>
  );
}
