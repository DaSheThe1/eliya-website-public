"use client";

import type { ReactNode } from "react";

export interface AnnouncerProps {
  children: ReactNode;
  politeness?: "assertive" | "polite";
}

export function Announcer({
  children,
  politeness = "polite",
}: AnnouncerProps) {
  return (
    <div aria-atomic="true" aria-live={politeness} className="a11y-visually-hidden">
      {children}
    </div>
  );
}
