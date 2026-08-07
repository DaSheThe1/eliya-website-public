import type { AnchorHTMLAttributes } from "react";

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
}

export function SkipLink({
  children = "Skip to main content",
  targetId = "main-content",
  ...props
}: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} {...props} className="a11y-skip-link">
      {children}
    </a>
  );
}
