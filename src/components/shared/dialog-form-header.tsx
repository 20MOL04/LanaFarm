"use client";

import * as React from "react";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  title: React.ReactNode;
};

/** Titre seul — le toggle 1j/multi est à côté du calendrier. */
export function DialogFormHeader({ title }: Props) {
  return (
    <DialogHeader className="shrink-0 pr-10">
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
  );
}
