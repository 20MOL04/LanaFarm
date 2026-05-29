"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "flex w-[min(100vw-1rem,100%)] max-w-lg max-h-[min(92dvh,100%)] flex-col overflow-hidden",
        "rounded-card border border-border bg-card shadow-modal",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-2.5 top-2.5 rounded-sm p-1 text-muted",
          "hover:bg-card-muted hover:text-foreground transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue"
        )}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Fermer</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Header du dialog — barre compacte avec bordure basse.
 * Ne scrolle pas (sticky en haut grâce au flex parent).
 */
function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-b border-border px-4 py-2.5 pr-10",
        className
      )}
      {...props}
    />
  );
}

/**
 * Footer du dialog — 2 colonnes côte à côte (compact, une seule ligne).
 * Un seul bouton → pleine largeur. Surcharger className pour d'autres layouts.
 */
function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-4 py-2.5",
        "[&>button]:w-full [&>button]:min-w-0",
        "[&>button:only-child]:col-span-2",
        className
      )}
      {...props}
    />
  );
}

/**
 * Body scrollable au besoin — placé entre Header et Footer.
 * Pour les formulaires longs, le body scrolle pendant que header + footer restent visibles.
 */
function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

/** Zone scrollable (tableau / champs) — le preview reste hors de cette zone. */
function DialogScrollRegion({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);

  const handleWheelCapture = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const region = ref.current;
    if (!region) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "number") return;
    region.scrollTop += e.deltaY;
    e.preventDefault();
  }, []);

  return (
    <div
      ref={ref}
      data-dialog-scroll=""
      onWheelCapture={handleWheelCapture}
      className={cn(
        "overflow-auto overscroll-contain",
        className
      )}
      {...props}
    />
  );
}

/** Preview fixe entre le corps scrollable et le footer. */
function DialogPreviewBar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 border-t border-border bg-card px-4 py-2", className)}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-[14px] font-semibold text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[11.5px] text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogScrollRegion,
  DialogPreviewBar,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
