"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  /** Toggle 1 jour / plusieurs jours — aligné à droite, face au calendrier. */
  toggle?: React.ReactNode;
};

export function DialogDateRow({ children, toggle }: Props) {
  return (
    <div className="flex w-full min-w-0 shrink-0 items-end justify-between gap-4">
      <div className="min-w-0 shrink-0">{children}</div>
      {toggle ? <div className="ml-auto shrink-0 self-end">{toggle}</div> : null}
    </div>
  );
}
