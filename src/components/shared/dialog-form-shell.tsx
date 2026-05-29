"use client";

import * as React from "react";

import { DialogFormHeader } from "@/components/shared/dialog-form-header";
import {
  DIALOG_BODY,
  DIALOG_FIT_CONTENT,
  DIALOG_FORM,
  DIALOG_INNER,
  DIALOG_SINGLE_MAX,
} from "@/components/shared/form-dialog-styles";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogPreviewBar,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  body: React.ReactNode;
  preview?: React.ReactNode | null;
  footer: React.ReactNode;
  /** Surcharge largeur modale (ex. DIALOG_COMPACT_MAX). */
  contentClassName?: string;
  previewBarClassName?: string;
};

export function DialogFormShell({
  open,
  onOpenChange,
  title,
  onSubmit,
  body,
  preview,
  footer,
  contentClassName,
  previewBarClassName,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_FIT_CONTENT, DIALOG_SINGLE_MAX, contentClassName)}>
        <div className={DIALOG_INNER}>
          <DialogFormHeader title={title} />
          <form onSubmit={onSubmit} className={DIALOG_FORM}>
            <DialogBody className={DIALOG_BODY}>{body}</DialogBody>
            {preview ? (
              <DialogPreviewBar className={previewBarClassName}>{preview}</DialogPreviewBar>
            ) : null}
            <DialogFooter>{footer}</DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
