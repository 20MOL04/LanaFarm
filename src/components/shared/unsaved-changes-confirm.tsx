"use client";

import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type Props = React.ComponentProps<typeof ConfirmDialog>;

/** Confirmation standard — branchée via useUnsavedDialogClose(). */
export function UnsavedChangesConfirm(props: Props) {
  return <ConfirmDialog {...props} />;
}
