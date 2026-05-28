import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap",
    "rounded-button text-sm font-medium",
    "transition-all duration-150 select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "[&>svg]:size-4 [&>svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-secondary shadow-[0_1px_2px_rgba(15,23,42,0.08)]",
        accent:
          "bg-accent-blue text-white hover:bg-[var(--color-sidebar)] active:bg-[var(--color-sidebar)] shadow-[0_1px_2px_rgba(29,78,216,0.18)]",
        secondary:
          "bg-card-muted text-foreground hover:bg-border",
        outline:
          "border border-border bg-card text-foreground [&>svg]:text-accent-blue hover:border-accent-blue/40 hover:bg-accent-blue-soft/30 hover:text-accent-blue",
        ghost:
          "text-foreground [&>svg]:text-accent-blue hover:bg-accent-blue-soft/40 hover:text-accent-blue",
        danger:
          "bg-danger text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,var(--color-primary))] active:bg-[color-mix(in_srgb,var(--color-danger)_80%,var(--color-primary))]",
        link:
          "text-accent-blue underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[12px]",
        md: "h-9 px-3.5 text-[13px]",
        lg: "h-10 px-4 text-[13.5px]",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
