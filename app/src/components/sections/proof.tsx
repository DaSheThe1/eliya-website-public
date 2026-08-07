"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Container } from "@foundation/ui";

import { SectionCta } from "@/components/ui/section-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProofItem, SiteContent } from "@/content";

import { Gallery } from "./gallery";

/**
 * The proof section: TWO galleries, split by what the artefact is.
 *
 * Daniel, 2026-08-05: *"Could be a gallery where it is like two rows because we
 * have a lot of them so set a split into two. We can have one for audio/video
 * and one for regular images."*
 *
 * The split is by `media.kind` rather than by a hand-maintained second list, so
 * adding an artefact to `proof.items` files it into the right track on its own
 * and neither track can drift out of sync with the content.
 *
 * ⚠️ THE PULLED QUOTES ARE NO LONGER IN THIS SECTION. Two of the twelve slides
 * were `kind: "quote"`, and both were verbatim duplicates of testimonials that
 * already appear in their own section immediately below this one — the same
 * words from ר.מ and נ.ש, twice on one page, about 800px apart. They are gone
 * from `proof.items`. The `quote` branch stays implemented in the gallery
 * because the type still allows it and a future artefact may need it.
 *
 * The viewer below is shared by both tracks. It exists because a phone
 * screenshot at tile scale is unreadable, and every one of these is a
 * conversation whose entire value is the words inside it.
 */
export function Proof({ content }: { content: SiteContent }) {
  const { proof } = content;

  const stills = proof.items.filter((item) => item.media.kind === "image");
  const media = proof.items.filter((item) => item.media.kind !== "image");

  const [open, setOpen] = useState<ProofItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const show = useCallback((item: ProofItem) => {
    // Remember what was focused so focus can go back there on close; a viewer
    // that dumps focus at the top of the document loses a keyboard user's place
    // in a gallery of eleven items.
    openerRef.current = document.activeElement as HTMLElement | null;
    setOpen(item);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus?.();
  }, []);

  /*
   * A native <dialog> opened with showModal(). The browser then owns the focus
   * trap, the inert backdrop, the Escape key and the top layer — all of which
   * would otherwise be several hundred lines of the kind of code that is
   * usually subtly wrong.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <section aria-labelledby="proof-title" className="section proof" id="proof">
      <Container>
        <SectionHeading
          id="proof-title"
          lead={proof.descriptionLines}
          lines={proof.titleLines}
        />

        <div className="proof__tracks">
          <Gallery
            expandLabel={proof.expandLabel}
            heading={proof.stillsLabel}
            items={stills}
            nextLabel={proof.nextLabel}
            onOpen={show}
            fullscreenLabel={proof.fullscreenLabel}
            muteLabel={proof.muteLabel}
            pauseLabel={proof.pauseLabel}
            playLabel={proof.playLabel}
            unmuteLabel={proof.unmuteLabel}
            previousLabel={proof.previousLabel}
          />
          <Gallery
            expandLabel={proof.expandLabel}
            heading={proof.mediaLabel}
            items={media}
            nextLabel={proof.nextLabel}
            onOpen={show}
            fullscreenLabel={proof.fullscreenLabel}
            muteLabel={proof.muteLabel}
            pauseLabel={proof.pauseLabel}
            playLabel={proof.playLabel}
            unmuteLabel={proof.unmuteLabel}
            previousLabel={proof.previousLabel}
          />
        </div>
        <SectionCta cta={proof.cta} />
      </Container>

      <dialog
        className="viewer"
        onCancel={close}
        onClick={(event) => {
          // Backdrop clicks land on the <dialog> itself; anything inside the
          // figure stops here and does not close the viewer.
          if (event.target === dialogRef.current) close();
        }}
        ref={dialogRef}
      >
        {open && open.media.kind === "image" ? (
          <figure className="viewer__figure">
            <button
              aria-label={proof.closeLabel}
              className="viewer__close"
              onClick={close}
              type="button"
            >
              <svg aria-hidden fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
            <img alt={open.alt} className="viewer__image" src={open.media.src} />
            <figcaption className="viewer__caption">{open.caption}</figcaption>
          </figure>
        ) : null}
      </dialog>
    </section>
  );
}
