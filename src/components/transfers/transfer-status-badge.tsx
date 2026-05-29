import * as React from "react";
import { AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TransfertStatut } from "@/types/domain";

type Props = {
  status: TransfertStatut;
  withIcon?: boolean;
};

const META: Record<
  TransfertStatut,
  { label: string; tone: "success" | "warning" | "danger"; icon: React.ElementType }
> = {
  recu: { label: "Reçu", tone: "success", icon: CheckCircle2 },
  en_attente: { label: "En attente", tone: "warning", icon: Hourglass },
  conteste: { label: "Contesté", tone: "danger", icon: AlertTriangle },
};

function TransferStatusBadgeComponent({ status, withIcon = true }: Props) {
  const meta = META[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      {withIcon ? <Icon className="h-3 w-3" /> : null}
      {meta.label}
    </Badge>
  );
}

export const TransferStatusBadge = React.memo(TransferStatusBadgeComponent);
