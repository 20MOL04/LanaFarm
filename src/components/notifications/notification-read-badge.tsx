import { cn } from "@/lib/utils";

type Props = {
  unread: boolean;
  className?: string;
};

/** Indicateur lu / non lu — texte court, casse normale. */
export function NotificationReadBadge({ unread, className }: Props) {
  return (
    <span
      className={cn(
        "shrink-0 text-[10px] font-medium leading-none",
        unread ? "text-accent-blue" : "text-muted",
        className
      )}
    >
      {unread ? "Non lue" : "Lue"}
    </span>
  );
}
