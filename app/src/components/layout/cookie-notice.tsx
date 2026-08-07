"use client";

import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";
import { useStoredState } from "@/lib/stored-state";

const STORAGE_KEY = "eliya.cookie-notice.v1";

/**
 * The cookie notice.
 *
 * This site sets no tracking cookies. Umami is cookieless and carries no
 * personal identifier, which is exactly why it is not gated behind consent, and
 * there is no Google tag on the page at all. So this is a NOTICE, not a consent
 * wall: it does not block the page, it does not pretend to collect a legal
 * basis it does not need, and the decline button does something real rather
 * than being decorative.
 *
 * The choice lives in localStorage, not in a cookie. A cookie banner that sets
 * a cookie to remember you dismissed the cookie banner is a joke this site does
 * not need to make.
 */
export function CookieNotice({ content }: { content: SiteContent }) {
  const [choice, setChoice] = useStoredState<string>(
    STORAGE_KEY,
    "",
    (raw) => JSON.parse(raw) as string,
  );

  function decide(next: "accepted" | "declined") {
    try {
      // Umami reads this key before it counts anything.
      if (next === "declined") {
        window.localStorage.setItem("umami.disabled", "1");
      } else {
        window.localStorage.removeItem("umami.disabled");
      }
    } catch {
      // Nothing to persist to; the choice still applies to this page view.
    }
    setChoice(next);
  }

  // The server snapshot is "" so nothing renders during SSR and the notice
  // appears on hydration, which is also what stops it flashing for someone who
  // has already answered.
  if (choice) return null;

  return (
    <aside aria-label={content.cookies.title} className="cookie-notice">
      {/*
        ⚠️ A PHOTOGRAPH OF A BISCUIT, NOT A LINE-ART COOKIE GLYPH.

        This is the single load-bearing detail of Daniel's house pattern, and it
        was the thing this notice was missing: *"check what I have in place for
        my website, which is automations-website and pnina-website. Where we have
        the nice cookies image and then the text is thoughtful and funny."* Both
        of those sites pin a round photo inside-start of the cloud, and it is
        what makes the joke land — a drawn cookie icon reads as a compliance
        symbol, which is exactly the register the copy is trying to escape.

        The asset is Daniel's own `cookie-consent-cookie.webp` from pnina, 45.9KB
        at 373x373, copied to `/media/cookie.webp`. It is decorative: the notice
        already has an accessible name and the sentence beside it says the word.
      */}
      <img
        alt=""
        aria-hidden
        className="cookie-notice__cookie"
        height={373}
        src={siteUrl("/media/cookie.webp")}
        width={373}
      />

      <p className="cookie-notice__text">
        {content.cookies.body}{" "}
        <a
          className="cookie-notice__link"
          href={siteUrl(
            `/${content.locale}/${content.legal.pages.privacy.slug}`,
          )}
        >
          {content.cookies.privacyLabel}
        </a>
      </p>

      {/*
        ⚠️ THE TITLE ROW IS GONE. It said "עוגיות" directly above a sentence
        whose first word is "עוגייה". One line, like both reference sites.

        ⚠️ UNEQUAL WEIGHT, AND ACCEPT IS FIRST IN SOURCE ORDER. Two identically
        styled buttons make a visitor stop and read both; the primary action is
        the filled one and the opt-out is the quiet one beside it. The opt-out
        still does something real — see `decide` above — which is the part that
        matters ethically. It is quiet, not hidden.
      */}
      <div className="cookie-notice__actions">
        <button
          className="ui-button cookie-notice__accept"
          onClick={() => decide("accepted")}
          type="button"
        >
          {content.cookies.accept}
        </button>
        <button
          className="ui-button ui-button--quiet cookie-notice__decline"
          onClick={() => decide("declined")}
          type="button"
        >
          {content.cookies.decline}
        </button>
      </div>
    </aside>
  );
}
