import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Tailles typo custom — groupe font-size pour ne pas écraser text-white sur les boutons. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "micro",
            "caption",
            "label",
            "body-sm",
            "body",
            "nav",
            "title",
            "page",
          ],
        },
      ],
    },
  },
});

/**
 * Concatène et déduplique des classes Tailwind.
 * Usage : <div className={cn("p-4", isActive && "bg-card")} />
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
