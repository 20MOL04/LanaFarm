import { GuideLinkButton } from "@/components/guide/guide-link-button";
import { GuideRichText } from "@/components/guide/guide-rich-text";
import type { GuideBlock } from "@/lib/user-guide/types";
import { cn } from "@/lib/utils";

export function GuideBlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return (
        <GuideRichText
          as="p"
          text={block.text}
          className="text-body leading-relaxed text-foreground"
        />
      );
    case "h3":
      return (
        <h3 className="text-title font-semibold text-foreground pt-2">
          <GuideRichText text={block.text} />
        </h3>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-2 pl-5 text-body leading-relaxed text-foreground">
          {block.items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 24)}`}>
              <GuideRichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-2 pl-5 text-body leading-relaxed text-foreground">
          {block.items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 24)}`}>
              <GuideRichText text={item} />
            </li>
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
          <GuideRichText as="p" text={block.text} />
        </div>
      );
    case "warning":
      return (
        <div
          className={cn(
            "rounded-card border border-warning/40 border-l-2 border-l-warning",
            "bg-warning-soft/50 px-4 py-3 text-body leading-relaxed text-foreground"
          )}
        >
          {block.title ? (
            <p className="mb-1 font-semibold text-foreground">{block.title}</p>
          ) : null}
          <GuideRichText as="p" text={block.text} />
        </div>
      );
    case "links":
      return (
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {block.links.map((link) => (
            <GuideLinkButton key={link.href + link.label} href={link.href} label={link.label} />
          ))}
        </div>
      );
    default:
      return null;
  }
}
