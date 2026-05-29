import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  href: string;
  label: string;
};

/** Bouton de navigation vers une vraie page de l'application. */
export function GuideLinkButton({ href, label }: Props) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-1.5">
      <Link href={href}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
