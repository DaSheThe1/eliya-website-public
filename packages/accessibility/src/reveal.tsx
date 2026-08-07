import type { HTMLAttributes } from "react";

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: 0 | 1 | 2 | 3;
}

/**
 * A fail-open decorative reveal. Its children are visible in server HTML and
 * remain visible when JavaScript, observers, or animation support are absent.
 */
export function Reveal({ className, delay = 0, ...props }: RevealProps) {
  const classes = ["a11y-reveal", `a11y-reveal--delay-${delay}`, className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
