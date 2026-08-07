"use client";

import { useEffect, useState } from "react";

import { Container, buttonStyles } from "@foundation/ui";

import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";

import { SocialIcon } from "./social-icons";

/**
 * The header is sticky on every width, including phones, where it used to
 * collapse to a bare wordmark. On a phone the nav folds into a disclosure and
 * the call to action stays visible in the bar, because the CTA is the reason
 * the header exists.
 *
 * ⚠️ THE SOCIAL ICONS ARE BACK, and the note that used to sit here saying they
 * were removed on Daniel's instruction was reversed by him on 2026-08-05:
 * *"There are no social media buttons in the header."* They are the same two
 * links as the footer's, rendered as glyph buttons so they cost the bar almost
 * no width, and they sit BEFORE the CTA in source order so the CTA is still the
 * last thing a tab key reaches.
 *
 * ⚠️ THE SECOND LINE UNDER HER NAME IS GONE. It was `brand.descriptor`, set in
 * muted grey at `--text-xs`, and it repeated the page's meta description at a
 * size nobody reads. Daniel, same message: *"the line under the name in the
 * header is pure garbage."* Her name alone is the wordmark now. That also
 * clears an axe `image-redundant-alt` violation, since the portrait's alt text
 * was her name and her name was already the text beside it — the portrait is
 * decorative here and carries an empty alt.
 */
export function SiteHeader({ content }: { content: SiteContent }) {
  const [open, setOpen] = useState(false);

  // A resize past the breakpoint leaves the phone menu open behind a desktop
  // layout, where nothing can close it.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 56rem)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);

  return (
    <header className="site-header" data-open={open ? "true" : "false"}>
      <Container className="site-header__inner">
        <a
          aria-label={content.brand.name}
          className="brand"
          href={siteUrl(`/${content.locale}`)}
        >
          <img
            alt=""
            className="brand__portrait"
            height={96}
            src={content.brand.portrait}
            width={96}
          />
          <span className="brand__text">
            <strong>{content.brand.name}</strong>
          </span>
        </a>

        <nav aria-label={content.navigationLabel} className="site-nav">
          {content.navigation.map((item) => (
            <a href={siteUrl(item.href)} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <ul className="site-social">
            {content.social.map((item) => (
              <li key={item.id}>
                {/*
                  ⚠️ `data-social` IS WHAT CARRIES THE BRAND COLOUR. Daniel,
                  2026-08-06: *"We should add the colors to the social icons in
                  the header."* They were both `--color-ink-muted`, a grey
                  hairline ring — two identical circles distinguishable only by
                  the glyph inside, which is the slowest possible way to find the
                  one you want.

                  Each id now paints its own product's affordance: Instagram's
                  gradient tile, WhatsApp's green disc, white glyph on both. The
                  green is the same `#25d366` as the floating button already on
                  this page, so the two WhatsApp entry points read as one thing.

                  On the white-on-green contrast: WCAG 1.4.11 exempts logotypes
                  and any graphic whose particular presentation is essential to
                  what it conveys, which is the entire job of a brand mark. The
                  link's accessible name is the real label; the glyph is
                  `aria-hidden` and carries no information on its own.
                */}
                <a
                  aria-label={item.label}
                  className="site-social__link"
                  data-social={item.id}
                  href={item.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <SocialIcon id={item.id} />
                </a>
              </li>
            ))}
          </ul>

          <a className={buttonStyles({ className: "site-header__cta" })} href={siteUrl("#contact")}>
            {content.shortCta}
          </a>

          <button
            aria-expanded={open}
            aria-label={open ? content.closeLabel : content.menuLabel}
            className="site-menu-toggle"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <span aria-hidden />
            <span aria-hidden />
            <span aria-hidden />
          </button>
        </div>
      </Container>

      {open ? (
        <nav aria-label={content.navigationLabel} className="site-drawer">
          {content.navigation.map((item) => (
            <a href={siteUrl(item.href)} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
