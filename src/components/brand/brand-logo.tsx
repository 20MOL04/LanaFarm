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
      {showWordmark ? (
        <span className="truncate text-sm font-semibold leading-none tracking-tight">
          {site.name}
        </span>
      ) : null}
    </span>
  );
}
