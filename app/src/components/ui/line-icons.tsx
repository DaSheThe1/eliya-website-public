/**
 * The site's glyph set: thin gold strokes, one 24px grid, no fills.
 *
 * ⚠️ THESE REPLACED EMOJI. The pain list ran 📅 💸 📱 🎥 ⏳ 😔 and the method
 * cards ran 🎯 🔥 👑. Emoji are rendered by the operating system, so they carry
 * Apple's or Google's house style and a palette of their own that nothing else
 * on this page uses — on a dark luxury page they read as the cheapest element
 * on screen. Every glyph below inherits `currentColor` instead, so the palette
 * owns them.
 *
 * All are decorative: each sits beside copy that already says the same thing,
 * so they are `aria-hidden` and a screen reader never meets them. That is also
 * why none of them needs to be individually recognisable — they are texture and
 * rhythm down the left edge of a list, not information.
 *
 * Stroke weight is 1.5 at 24px. Anything thinner disappears against the surface
 * fills; anything heavier stops reading as a hairline and starts competing with
 * the type.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24" {...STROKE}>
      {children}
    </svg>
  );
}

/** A diary with a thin slot where the entries would be: a calendar with gaps. */
function CalendarGlyph() {
  return (
    <Glyph>
      <rect height="16" rx="2.5" width="18" x="3" y="5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M7.5 14h4" opacity="0.55" />
    </Glyph>
  );
}

/** A banknote. The price question, without a currency that dates the page. */
function MoneyGlyph() {
  return (
    <Glyph>
      <rect height="12" rx="2" width="20" x="2" y="6" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" opacity="0.55" />
    </Glyph>
  );
}

/** A phone with an empty speech bubble on it: posted, and nobody answered. */
function SilentPhoneGlyph() {
  return (
    <Glyph>
      <rect height="20" rx="2.6" width="13" x="5.5" y="2" />
      <path d="M10.5 19.2h3" />
      <path d="M9 7.5h6a1.4 1.4 0 0 1 1.4 1.4v2.7a1.4 1.4 0 0 1-1.4 1.4h-2.4L10.4 15v-2H9a1.4 1.4 0 0 1-1.4-1.4V8.9A1.4 1.4 0 0 1 9 7.5Z" opacity="0.7" />
    </Glyph>
  );
}

/** A camera. The one she does not want to stand in front of. */
function CameraGlyph() {
  return (
    <Glyph>
      <path d="M3 8.5h3.2l1.6-2.4h8.4l1.6 2.4H21a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </Glyph>
  );
}

/** An hourglass: more hours in, less out. */
function HourglassGlyph() {
  return (
    <Glyph>
      <path d="M6.5 2.5h11M6.5 21.5h11" />
      <path d="M7.5 2.5v3.2c0 2.2 4.5 4.1 4.5 6.3s-4.5 4.1-4.5 6.3v3.2" />
      <path d="M16.5 2.5v3.2c0 2.2-4.5 4.1-4.5 6.3s4.5 4.1 4.5 6.3v3.2" />
    </Glyph>
  );
}

/** Two bars, one taller. Watching someone else pull ahead. */
function ComparisonGlyph() {
  return (
    <Glyph>
      <path d="M3 21h18" />
      <rect height="7" rx="1" width="5" x="4.5" y="14" opacity="0.6" />
      <rect height="14" rx="1" width="5" x="14.5" y="7" />
      <path d="M17 3.5v2M15.7 4.4h2.6" opacity="0.7" />
    </Glyph>
  );
}

/** A target with the arrow already in it: marketing that produces enquiries. */
function TargetGlyph() {
  return (
    <Glyph>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4" />
      <path d="M11 13 21 3M17.5 3H21v3.5" />
    </Glyph>
  );
}

/** A spark. The mental half: confidence in front of the camera. */
function SparkGlyph() {
  return (
    <Glyph>
      <path d="M12 2.5c2.4 3.6 5.6 5.4 5.6 9.6A5.6 5.6 0 0 1 12 17.7a5.6 5.6 0 0 1-5.6-5.6C6.4 7.9 9.6 6.1 12 2.5Z" />
      <path d="M12 21.5v-3.8" />
      <path d="M10.2 12.2c0-1.6 1-2.5 1.8-3.6.8 1.1 1.8 2 1.8 3.6a1.8 1.8 0 0 1-3.6 0Z" opacity="0.6" />
    </Glyph>
  );
}

/** A crown. Pricing that respects the work. */
function CrownGlyph() {
  return (
    <Glyph>
      <path d="M3 7.5l3.4 3.1L12 4.5l5.6 6.1L21 7.5l-1.7 11H4.7L3 7.5Z" />
      <path d="M4.7 18.5h14.6" opacity="0.6" />
    </Glyph>
  );
}

const GLYPHS: Record<string, () => React.JSX.Element> = {
  calendar: CalendarGlyph,
  money: MoneyGlyph,
  "silent-phone": SilentPhoneGlyph,
  camera: CameraGlyph,
  hourglass: HourglassGlyph,
  comparison: ComparisonGlyph,
  target: TargetGlyph,
  spark: SparkGlyph,
  crown: CrownGlyph,
};

/**
 * Renders the glyph named by a content `icon` key.
 *
 * An unknown key renders NOTHING rather than a fallback box. These are
 * decorative, so a missing one costs the reader nothing, whereas a placeholder
 * square in a luxury layout costs quite a lot.
 */
export function LineIcon({ name }: { name: string }) {
  const Component = GLYPHS[name];
  return Component ? <Component /> : null;
}
