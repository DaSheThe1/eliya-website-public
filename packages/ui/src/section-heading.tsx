import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

export interface SectionHeadingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}

export function SectionHeading({
  className,
  description,
  eyebrow,
  title,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn("ui-section-heading", className)} {...props}>
      {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="ui-section-heading__copy">{description}</p> : null}
    </div>
  );
}
