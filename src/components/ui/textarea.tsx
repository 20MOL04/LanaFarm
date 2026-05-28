import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-input bg-card px-3 py-2 text-sm",
          "border border-border text-foreground placeholder:text-muted-foreground",
          "transition-colors resize-none",
          "focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
