import Image from "next/image";

import { site } from "@/config/site";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
} as const;

export type BrandLogoSize = keyof typeof SIZES;

type BrandLogoProps = {
  size?: BrandLogoSize;
  /** Affiche « LanaFarm » à côté du pictogramme (sidebar dépliée). */
  showWordmark?: boolean;
  /** Titre login : Lana + Farm coloré, même hauteur que l’icône. */
  variant?: "default" | "login";
  className?: string;
  priority?: boolean;
};

/**
 * Logo officiel LanaFarm (favicon / login / sidebar).
 */
export function BrandLogo({
  size = "md",
  showWordmark = false,
  variant = "default",
  className,
  priority = false,
}: BrandLogoProps) {
  const px = SIZES[size];

  if (variant === "login") {
    return (
      <span
        className={cn("inline-flex items-center gap-3", className)}
        aria-label={site.name}
      >
        <Image
          src="/logo.png"
          alt=""
          width={px}
          height={px}
          priority={priority}
          className="shrink-0 rounded-[22%] object-contain"
          sizes={`${px}px`}
        />
        <span
          className="font-bold leading-none tracking-tight"
          style={{ fontSize: `${Math.round(px * 0.68)}px` }}
        >
          <span className="text-foreground">Lana</span>
          <span className="text-accent-blue">Farm</span>
        </span>
      </span>
    );
  }

  if (showWordmark) {
    const textPx = 20;
    const iconPx = 22;

    return (
      <span
        className={cn("inline-flex items-center gap-2.5 md:gap-2", className)}
        aria-label={site.name}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center md:h-4 md:w-4">
          <Image
            src="/logo.png"
            alt=""
            width={iconPx}
            height={iconPx}
            priority={priority}
            className="h-full w-full shrink-0 rounded-[18%] object-contain"
            sizes={`${iconPx}px`}
          />
        </span>
        <span
          className="truncate font-bold leading-none tracking-tight"
          style={{ fontSize: `${textPx}px` }}
        >
          {site.name}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label={site.name}
    >
      <Image
        src="/logo.png"
        alt=""
        width={px}
        height={px}
        priority={priority}
        className="shrink-0 rounded-[22%] object-contain"
        sizes={`${px}px`}
      />
    </span>
  );
}
