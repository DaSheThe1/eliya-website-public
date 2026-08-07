import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "quiet";

export function buttonStyles({
  variant = "primary",
  className,
}: {
  variant?: ButtonVariant;
  className?: string;
} = {}): string {
  return cn("ui-button", `ui-button--${variant}`, className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, className })}
      type={type}
      {...props}
    />
  );
}
