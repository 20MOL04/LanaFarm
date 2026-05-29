import { GuideLinkButton } from "@/components/guide/guide-link-button";
import type { GuideBlock } from "@/lib/user-guide/types";
import { cn } from "@/lib/utils";

export function GuideBlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-body leading-relaxed text-foreground">{block.text}</p>;
    case "h3":
      return (
        <h3 className="text-title font-semibold text-foreground pt-2">{block.text}</h3>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-2 pl-5 text-body leading-relaxed text-foreground">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-2 pl-5 text-body leading-relaxed text-foreground">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "tip":
      return (
        <div
          className={cn(
            "rounded-card border border-info/30 bg-info-soft/40 px-4 py-3",
            "text-body leading-relaxed text-foreground"
          )}
        >
          {block.title ? (
            <p className="mb-1 font-semibold text-foreground">{block.title}</p>
          ) : null}
          <p>{block.text}</p>
        </div>
      );
    case "warning":
      return (
        <div
          className={cn(
            "rounded-card border border-warning/40 bg-warning-soft/50 px-4 py-3",
            "text-body leading-relaxed text-foreground"
          )}
        >
          {block.title ? (
            <p className="mb-1 font-semibold text-foreground">{block.title}</p>
          ) : null}
          <p>{block.text}</p>
        </div>
      );
    case "links":
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {block.links.map((link) => (
            <GuideLinkButton key={link.href + link.label} href={link.href} label={link.label} />
          ))}
        </div>
      );
    default:
      return null;
  }
}
