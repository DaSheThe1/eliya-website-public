import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  narrow?: boolean;
}

export function Container({
  className,
  narrow = false,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("ui-container", narrow && "ui-container--narrow", className)}
      {...props}
    />
  );
}
