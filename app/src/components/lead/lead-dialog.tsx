"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ContactForm } from "@/components/sections/contact-form";
import type { SiteContent } from "@/content";

/**
 * A single, app-wide lead popup. The provider is mounted once in the locale
 * layout; any call to action opens it through `useLeadDialog().open()`.
 *
 * ⚠️ WHY THIS EXISTS: EVERY CTA USED TO SCROLL TO THE BOTTOM OF THE PAGE.
 *
 * Daniel, 2026-08-07: *"pressing on any of the CTAs, instead of having them
 * open the contact form, it scrolls down to the bottom of the page to that
 * contact. We want to have the same contact for the method that we use for
 * Yarin, Pnina, and myself."*
 *
 * They were all `<a href="#contact">`, so pressing one — at the top of a very
 * long page — threw the reader past every section to the footer. Twelve buttons
 * whose entire job is to convert, all spending their click on a scroll. Pnina,
 * Yarin and automations all open a popup instead, and this is that pattern.
 *
 * ── IT IS THE SAME FORM, NOT A SECOND ONE ──
 * `ContactForm` is rendered here unchanged, so the popup and the contact
 * section share one implementation, one field allowlist and one endpoint. A
 * duplicate form is how the two drift until only one of them still posts the
 * right shape.
 *
 * ── A NATIVE <dialog>, NOT A PORTAL ──
 * Pnina reaches for Base UI's Dialog; this project has no such dependency and
 * already drives the proof viewer with a native `<dialog>` and `showModal()`.
 * Same idiom here, and the browser gives us the focus trap, the Escape key, the
 * inert background and the top layer for nothing. `showModal()` is called from
 * an effect rather than at render because it is imperative and must not run
 * during React's render pass.
 *
 * ── THE OPENER IS RESTORED FOCUS EXPLICITLY ──
 * The browser returns focus to whatever was focused before `showModal()` in
 * most cases, but not reliably when the opener is re-rendered underneath an
 * open dialog. Storing it and restoring on close makes the keyboard path
 * deterministic instead of nearly right.
 */
interface LeadDialogValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LeadDialogContext = createContext<LeadDialogValue | null>(null);

/**
 * ⚠️ RETURNS null RATHER THAN THROWING WHEN THERE IS NO PROVIDER.
 *
 * Pnina's version throws, which is right when every caller is inside the
 * provider by construction. Here the callers include `SectionCta`, which also
 * renders on the three legal pages, and a call to action that hard-crashes the
 * privacy page because a provider is missing two levels up is a much worse
 * failure than one that quietly stays an ordinary link. Callers treat null as
 * "no popup available" and fall back to the anchor.
 */
export function useLeadDialog(): LeadDialogValue | null {
  return useContext(LeadDialogContext);
}

export function LeadDialogProvider({
  children,
  content,
}: {
  children: ReactNode;
  content: SiteContent;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <LeadDialogContext.Provider value={{ isOpen, open, close }}>
      {children}
      <dialog
        aria-labelledby="lead-dialog-title"
        className="lead-dialog"
        onCancel={close}
        onClick={(event) => {
          // Backdrop clicks land on the <dialog> element itself; anything
          // inside the panel stops there and does not close the popup.
          if (event.target === dialogRef.current) close();
        }}
        ref={dialogRef}
      >
        {isOpen ? (
          <div className="lead-dialog__panel">
            <button
              aria-label={content.closeLabel}
              className="lead-dialog__close"
              onClick={close}
              type="button"
            >
              <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>

            <p className="lead-dialog__title" id="lead-dialog-title">
              {content.contact.titleLines.join(" ")}
            </p>
            <p className="lead-dialog__lead">{content.contact.description}</p>

            <ContactForm content={content} />
          </div>
        ) : null}
      </dialog>
    </LeadDialogContext.Provider>
  );
}
