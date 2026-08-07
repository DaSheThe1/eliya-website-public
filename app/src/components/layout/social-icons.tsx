/**
 * The two social glyphs, in one place.
 *
 * They were inline in `floating-whatsapp.tsx` and nowhere else, because the
 * header carried no social links at all. It does now, so the WhatsApp path has
 * exactly one definition and Instagram has joined it.
 *
 * Both are `aria-hidden` and `focusable="false"`: every call site wraps them in
 * a link that already carries the accessible name, and an unlabelled glyph
 * announcing itself a second time is noise. They inherit `currentColor`, so the
 * palette drives them and nothing here hard-codes a brand colour — the one
 * exception is the floating WhatsApp button, which is deliberately WhatsApp
 * green because it is imitating that product's own affordance.
 */

type IconProps = { className?: string };

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={className} focusable="false" viewBox="0 0 24 24">
      <path
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.07-.8.38-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.71.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"
        fill="currentColor"
      />
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.21-8.23 8.21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg aria-hidden className={className} focusable="false" viewBox="0 0 24 24">
      <rect
        fill="none"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
        width="18"
        x="3"
        y="3"
      />
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="17.2" cy="6.8" fill="currentColor" r="1.2" />
    </svg>
  );
}

/** Picks the glyph for a `content.social[].id`. Unknown ids render nothing. */
export function SocialIcon({ id, className }: { id: string; className?: string }) {
  if (id === "instagram") return <InstagramIcon className={className} />;
  if (id === "whatsapp") return <WhatsAppIcon className={className} />;
  return null;
}
