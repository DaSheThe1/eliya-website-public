import { Container, buttonStyles } from "@foundation/ui";

import { headlineText } from "@/components/ui/section-heading";
import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";

import { SocialIcon } from "./social-icons";

/**
 * The footer, rebuilt 2026-08-06.
 *
 * Daniel: *"The foot area looks boring. Also I do release the social media and
 * footer without putting the icons and doing it nicely and organized. Shouldn't
 * the footer be different colors and overall better?"*
 *
 * Three separate faults, and they are worth separating because only one of them
 * was cosmetic:
 *
 *  1. THE SOCIAL LINKS WERE PLAIN TEXT. Measured: the footer rendered the words
 *     `אינסטגרם` and `וואטסאפ` as bare underlined links, while the header two
 *     hundred pixels above rendered the same two destinations as glyphs. The
 *     component for those glyphs was already imported elsewhere in this folder.
 *     They are now the same brand-coloured buttons as the header's, so the two
 *     ends of the page agree about what these links look like.
 *
 *  2. THE FOOTER HAD NO GROUND OF ITS OWN. Its only background was
 *     `linear-gradient(transparent, rgba(4,7,14,0.9))` — a fade into the same
 *     canvas every section above it sits on. Nothing said the page had ended.
 *     It now has its own surface, a gold hairline across the top, and a wash
 *     pulled from the hero's, so the page closes on the colour it opened on.
 *
 *  3. IT ASKED FOR NOTHING. The last thing on a landing page was a list of
 *     links. There is now one final invitation before the legal line, because
 *     someone who has read to the bottom of the page is the single most
 *     qualified reader on it.
 *
 * The nav needs its own accessible name (`footerNavigationLabel`) — two `<nav>`
 * landmarks sharing one name is an axe `landmark-unique` violation and reads as
 * the same menu twice to a screen reader.
 */
export function SiteFooter({ content }: { content: SiteContent }) {
  return (
    <footer className="site-footer">
      <span aria-hidden className="site-footer__wash" />
      <Container>
        <div className="site-footer__grid">
          <div className="site-footer__identity">
            <img
              alt={content.brand.portraitAlt}
              className="site-footer__portrait"
              height={128}
              loading="lazy"
              src={content.brand.portrait}
              width={128}
            />
            <div>
              <p className="site-footer__name">{content.brand.name}</p>
              <p className="site-footer__statement">
                {content.footer.statement}
              </p>
              <ul className="site-footer__social site-social">
                {content.social.map((item) => (
                  <li key={item.id}>
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
            </div>
          </div>

          <nav
            aria-label={content.footerNavigationLabel}
            className="site-footer__nav"
          >
            {content.navigation.map((item) => (
              <a href={siteUrl(item.href)} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-footer__close">
            <p className="site-footer__close-line">{headlineText(content.contact.titleLines)}</p>
            <a
              className={buttonStyles({ className: "site-footer__cta" })}
              href={siteUrl("#contact")}
            >
              {content.shortCta}
            </a>
          </div>
        </div>

        <div className="site-footer__legal">
          <p className="site-footer__rights">
            {content.brand.name} · {content.footer.rights}
          </p>
          {/* ⚠️ These three pages exist now. The contact form's fine print has
              always promised a privacy policy and there was not one. */}
          <nav
            aria-label={content.legal.navLabel}
            className="site-footer__legal-nav"
          >
            {(["privacy", "terms", "accessibility"] as const).map((key) => (
              <a
                href={siteUrl(`/${content.locale}/${content.legal.pages[key].slug}`)}
                key={key}
              >
                {content.legal.pages[key].title}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
