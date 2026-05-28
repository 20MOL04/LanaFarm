import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Wrapper homogène pour les champs de formulaire.
 * Label haut, contrôle au milieu, hint ou erreur en bas.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[11.5px] font-medium text-foreground"
      >
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-[10.5px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[10.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
