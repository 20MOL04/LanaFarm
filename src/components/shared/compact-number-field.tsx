"use client";

import * as React from "react";

import { FormField } from "@/components/shared/form-field";
import { FORM_INPUT_NUM_ICON } from "@/components/shared/form-dialog-styles";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
};

export function CompactNumberField({
  id,
  label,
  hint,
  icon,
  value,
  onChange,
  onBlur,
  error,
  required,
}: Props) {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <div className="relative w-[5rem]">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
          {icon}
        </span>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = parseInt(raw, 10);
            onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
          }}
          onBlur={onBlur}
          onFocus={(e) => e.currentTarget.select()}
          className={FORM_INPUT_NUM_ICON}
          required={required}
        />
      </div>
    </FormField>
  );
}
