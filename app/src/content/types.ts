export type Locale = "he";
export type Direction = "ltr" | "rtl";

export interface NavigationItem {
  href: `#${string}`;
  label: string;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

/**
 * The invitation that closes a section.
 *
 * ⚠️ EVERY `label` ON THE PAGE MUST BE A DIFFERENT STRING. A page that repeats
 * one button label teaches the reader to stop seeing it, and this page shipped
 * with the hero and the offer carrying the identical sentence. There is a unit
 * test asserting uniqueness; see `ui/section-cta.tsx`.
 */
export interface SectionCta {
  label: string;
  href: `#${string}`;
}

export interface PainItem {
  id: string;
  icon: string;
  text: string;
  /** The few words inside `text` that carry the sentence, set heavier. */
  emphasis: string;
}

export interface PillarItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  /** Which supplied screenshot this number comes from. */
  evidence: string;
}

/**
 * One slide of the proof carousel. The gallery carries more than screenshots:
 * a clip, a pulled quote and an audio message are all real artefacts she has,
 * and each needs its own presentation rather than being flattened to a picture.
 */
export type ProofMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster: string }
  | { kind: "audio"; src: string }
  | { kind: "quote"; text: string; attribution: string };

export interface ProofItem {
  id: string;
  media: ProofMedia;
  alt: string;
  caption: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  attribution: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * One station of the scroll-driven process journey.
 *
 * `lines` may carry `*…*` markers around the few words that should be set
 * apart. The marker is an asterisk because no line of Hebrew copy on this site
 * contains one; if that ever changes this needs a real escape rather than a
 * second delimiter.
 */
export interface ProcessStep {
  title: string;
  lines: string[];
}

/** A struck rung of the price ladder: what the number is, and the number. */
export interface LadderRung {
  label: string;
  price: string;
}

export interface SiteContent {
  locale: Locale;
  direction: Direction;
  meta: { title: string; description: string };
  brand: { name: string; descriptor: string; portrait: string; portraitAlt: string };
  navigation: NavigationItem[];
  navigationLabel: string;
  /**
   * The footer's nav needs a label of its OWN. Two `<nav>` landmarks sharing one
   * accessible name is an axe `landmark-unique` violation, and to a screen
   * reader listing landmarks it reads as the same menu twice.
   */
  footerNavigationLabel: string;
  menuLabel: string;
  closeLabel: string;
  skipLabel: string;
  social: SocialLink[];
  hero: {
    /**
     * ⚠️ AN ARRAY, ONE FINISHED THOUGHT PER ENTRY — not a string that the
     * browser breaks wherever it runs out of room.
     *
     * This was `title` + `titleAccent`, two strings, and at 1440px the browser
     * wrapped the first of them into `היומן / שלך יכול / להיות מלא.` — three
     * lines, none of which is a sentence. Daniel's standard is that every line
     * end and every new line is a finished sentence, so the line breaks are
     * COPY DECISIONS and they live here, not in `text-wrap`.
     *
     * The last entry is set in the gold gradient. Keep each line short enough
     * to survive a 390px viewport without re-wrapping — about 22 Hebrew
     * characters — or the whole point is lost on a phone.
     */
    titleLines: string[];
    /**
     * The sub-headline, and its job is NARROW: it answers the objection that
     * stops her reader believing the headline. It is not a bio and it is not a
     * summary of services — both of those belong in About, which is the very
     * next section. One entry per objection.
     */
    subheadLines: string[];
    description: string;
    primaryCta: string;
    secondaryCta: string;
    video: { src: string; poster: string; label: string };
    videoHint: string;
    /** The line inside the player's frame, above the clip. */
    videoCaption: string;
    playLabel: string;
    playWithSoundLabel: string;
    pauseLabel: string;
    muteLabel: string;
    fullscreenLabel: string;
  };
  about: {
    titleLines: string[];
    paragraphs: string[];
    cta: SectionCta;
    image: string;
    imageAlt: string;
    imageCaption: string;
  };
  /**
   * ⚠️ EVERY SECTION HEADING IS AN ARRAY, ONE FINISHED SENTENCE PER ENTRY.
   * This was `title: string` everywhere but the hero, and the browser broke
   * each of them wherever the box ran out of room: `#pain-title` measured two
   * visual lines at 720px, split at 720px rather than at the full stop. Where
   * a heading breaks is a copy decision, so it lives here. See
   * `ui/section-heading.tsx`.
   */
  pain: {
    titleLines: string[];
    description: string;
    items: PainItem[];
    cta: SectionCta;
  };
  method: {
    titleLines: string[];
    description: string;
    items: PillarItem[];
    cta: SectionCta;
  };
  process: {
    titleLines: string[];
    steps: ProcessStep[];
    cta: SectionCta;
    /**
     * "שלב 1 מתוך 4" — orientation inside the sequence, not a heading.
     *
     * ⚠️ A TEMPLATE STRING WITH `{current}` / `{total}`, NOT A FUNCTION. The
     * page is a Server Component and the scrub is a Client Component, so
     * everything in this object crosses that boundary and must be
     * serialisable. A function here throws "Functions cannot be passed directly
     * to Client Components" at render time.
     */
    progressLabel: string;
    /** The line under the last station. */
    endpoint: string;
    /** ⚠️ Shown on screen while the media is Pnina's placeholder clip. */
    mediaPlaceholderNote: string;
  };
  stats: {
    titleLines: string[];
    description: string;
    items: StatItem[];
    cta: SectionCta;
  };
  proof: {
    titleLines: string[];
    /** Rendered as one block, one line per entry. */
    descriptionLines: string[];
    cta: SectionCta;
    /**
     * ⚠️ ONE list, split into TWO tracks by `media.kind` at render time — see
     * `sections/proof.tsx`. Everything that is a picture goes in the stills
     * gallery; everything that plays goes in the media gallery. Ordering within
     * each track follows this array.
     */
    items: ProofItem[];
    /** Heading for the track of screenshots. */
    stillsLabel: string;
    /** Heading for the track of clips and voice notes. */
    mediaLabel: string;
    previousLabel: string;
    nextLabel: string;
    positionLabel: string;
    /** Accessible name for the button that opens an artefact full size. */
    expandLabel: string;
    closeLabel: string;
    /** Gallery clip controls. The stills tracks never use these. */
    playLabel: string;
    pauseLabel: string;
    muteLabel: string;
    unmuteLabel: string;
    fullscreenLabel: string;
  };
  testimonials: {
    titleLines: string[];
    items: TestimonialItem[];
    cta: SectionCta;
  };
  offer: {
    titleLines: string[];
    description: string;
    rungs: LadderRung[];
    /** The line the ladder lands on, set at display size. */
    freeLabel: string;
    cta: string;
  };
  faq: {
    titleLines: string[];
    items: FaqItem[];
    cta: SectionCta;
  };
  contact: {
    titleLines: string[];
    description: string;
    /** Her photograph beside the form. The last section had no face in it. */
    portrait: string;
    portraitAlt: string;
    /* ⚠️ NO `assurances` HERE, AND IT IS NOT AN OVERSIGHT. Three ticked lines
       used to sit under `description` reading "שם וטלפון בלבד" / "אני חוזרת
       אלייך אישית, לא מוקד" / "השיחה ללא עלות ובלי התחייבות". Daniel,
       2026-08-07: *"the text above them […] says exactly the same thing. Just a
       duplicate and unnecessary."* He is right on all three — see the note in
       `site-content.ts`. Reassurance that repeats the sentence above it does not
       reassure twice, it just makes the page longer. */
    labels: {
      name: string;
      phone: string;
      submit: string;
      submitting: string;
      privacy: string;
      success: string;
      error: string;
    };
  };
  /** Short form of the call, for the header button and the footer's close. */
  shortCta: string;
  whatsappFloatLabel: string;
  accessibility: {
    launcherLabel: string;
    title: string;
    close: string;
    reset: string;
    textSize: string;
    increase: string;
    decrease: string;
    contrast: string;
    spacing: string;
    motion: string;
    links: string;
    on: string;
    off: string;
  };
  cookies: {
    title: string;
    body: string;
    accept: string;
    decline: string;
    /** Link through to the privacy page from inside the notice. */
    privacyLabel: string;
  };
  /**
   * The three standing pages. `sections` is prose; `draftNote`, when present,
   * renders as a visible unresolved-content marker.
   *
   * ⚠️ NON-INVENTION APPLIES HERE HARDEST. A privacy policy is a CLAIM about
   * what the site does, and a terms page is a claim about who is contracting
   * with whom. Anything not actually known about her business — legal entity,
   * business number, address — stays a marked gap and blocks release rather
   * than being filled with something plausible.
   */
  legal: {
    backLabel: string;
    /** Third `<nav>` on the page, so it needs its own accessible name. */
    navLabel: string;
    updatedLabel: string;
    updatedAt: string;
    pages: Record<
      "privacy" | "terms" | "accessibility",
      {
        slug: string;
        title: string;
        description: string;
        sections: Array<{ heading: string; paragraphs: string[] }>;
        draftNote?: string;
      }
    >;
  };
  footer: { statement: string; rights: string };
}
