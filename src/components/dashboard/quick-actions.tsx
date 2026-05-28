import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { quickActions } from "@/config/navigation";
import { accentIconClass } from "@/lib/display-tokens";
import { cn } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  "/production?action=ajouter": "Entrer une production",
  "/ventes?action=ajouter": "Entrer une vente",
  "/depenses?action=ajouter": "Entrer une dépense",
  "/tresorerie?action=ajouter": "Saisir la trésorerie",
};

const PRIMARY_ACTIONS = quickActions.filter((a) => ACTION_LABEL[a.href]);

const actionButtonClass =
  "w-full justify-start gap-2 bg-card shadow-card hover:shadow-hover";

export function QuickActions() {
  return (
    <SectionCard className="h-fit w-full">
      <SectionHeader title="Actions rapides" compact />
      <SectionBody compact className="space-y-1.5">
        {PRIMARY_ACTIONS.map((action) => {
          const Icon = action.icon;
          const label = ACTION_LABEL[action.href] ?? action.label;
          return (
            <Button
              key={action.href}
              asChild
              variant="outline"
              size="sm"
              className={actionButtonClass}
            >
              <Link href={action.href}>
                <Icon className={cn("h-4 w-4", accentIconClass)} aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            </Button>
          );
        })}
        <Button asChild variant="ghost" size="sm" className="mt-0.5 w-full">
          <Link href="/rapports?action=generer">
            <ClipboardList className={cn("h-4 w-4", accentIconClass)} aria-hidden />
            Générer un rapport
          </Link>
        </Button>
      </SectionBody>
    </SectionCard>
  );
}
