import type { SiteContent } from "@/content";

import { WhatsAppIcon } from "./social-icons";

/**
 * The WhatsApp button, fixed bottom-right and outside every landmark, which
 * would otherwise leave it as orphaned content a screen-reader user browsing by
 * landmark skips entirely. `complementary` gives it a home without moving it in
 * the DOM.
 *
 * The halo is static. An endless attention pulse in the corner of every page is
 * a pressure mechanic; a ring that is simply there separates the button from
 * the page just as well and never asks for anything.
 */
export function FloatingWhatsApp({ content }: { content: SiteContent }) {
  const whatsapp = content.social.find((item) => item.id === "whatsapp");
  if (!whatsapp) return null;

  return (
    <div aria-label={content.whatsappFloatLabel} role="complementary">
      <a
        aria-label={content.whatsappFloatLabel}
        className="floating-whatsapp"
        href={whatsapp.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span aria-hidden className="floating-whatsapp__halo" />
        <WhatsAppIcon className="floating-whatsapp__icon" />
      </a>
    </div>
  );
}
