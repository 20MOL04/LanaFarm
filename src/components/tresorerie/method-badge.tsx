"use client";

import * as React from "react";

import { getMethodMeta } from "@/components/tresorerie/method-meta";
import { Badge } from "@/components/ui/badge";
import { useFarmConfig } from "@/contexts/farm-store";
import { resolveMethodeLabel } from "@/lib/config-defaults";

type Props = {
  /** ID de méthode (slug ou UUID). */
  method: string;
  withIcon?: boolean;
};

export function MethodBadge({ method, withIcon = true }: Props) {
  const config = useFarmConfig();
  const label = resolveMethodeLabel(method, config.listes.methodesPaiement);
  const meta = getMethodMeta(method);
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      {withIcon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </Badge>
  );
}
