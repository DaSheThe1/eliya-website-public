import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "soft" | "accent";
}

export function Surface({
  className,
  tone = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn("ui-surface", `ui-surface--${tone}`, className)}
      {...props}
    />
  );
}
