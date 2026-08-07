"use client";

import type { ReactNode } from "react";

import { siteUrl } from "@/lib/site-url";

import { useLeadDialog } from "./lead-dialog";

/**
 * A call to action that opens the lead popup, and is still a working link when
 * it cannot.
 *
 * ⚠️ IT STAYS AN `<a href="#contact">`, WHICH IS THE WHOLE DESIGN.
 *
 * The obvious implementation is a `<button onClick={open}>`. It would be wrong
 * three times over:
 *
 *   · `landing.spec.ts` asserts *"keeps essential content available without
 *     JavaScript"* against a context with JS disabled. A button that opens a
 *     React dialog is dead there; an anchor still moves the reader to the
 *     contact section, which is a real form on a static page.
 *   · The same spec asserts the first CTA has an `href` ending `#contact`.
 *     That assertion is not arbitrary — it is what stops the conversion path
 *     from quietly becoming unreachable.
 *   · Middle-click, ⌘-click and "copy link" all keep working on an anchor and
 *     all silently do nothing on a button.
 *
 * So the anchor is the truth and the popup is the enhancement: the click
 * handler cancels the navigation only once it knows a provider exists and the
 * press was an ordinary left click. A modified click — new tab, new window —
 * is left alone deliberately, because someone asking for a new tab has said
 * what they want and it is not a popup on this one.
 */
export function LeadLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const dialog = useLeadDialog();

  return (
    <a
      className={className}
      href={siteUrl("#contact")}
      onClick={(event) => {
        if (!dialog) return;
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        dialog.open();
      }}
    >
      {children}
    </a>
  );
}
