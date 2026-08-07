import type { Locale, SiteContent } from "./types";
import { generatedSiteConfig } from "@/config/generated-site";

/**
 * Hebrew copy for eliya.trickticmedia.com.
 *
 * Sourced from her Instagram (@eliya_thebeautybrand), her previous site, and the
 * eleven client screenshots in assets/testimonials/raw. Every number maps to a
 * specific supplied screenshot, named in `evidence`. Nothing is rounded up.
 *
 * Punctuation: no em dashes, no maqaf, no gershayim used as quote marks. Plain
 * sentences, commas and full stops only. The apostrophe in "ג'ל" is a geresh
 * inside a word, which is how the word is spelled, not punctuation.
 *
 * The offer is a FREE CALL. The two prices are struck through because they do
 * not apply: nothing is sold on this page. She sells on the call.
 */
const he = {
  locale: "he",
  direction: "rtl",
  meta: {
    title: "אליה יצחק, מאמנת שיווקית ומנטלית לעסקי ביוטי",
    description:
      "מלווה בעלות עסקי ביוטי למלא את היומן בלקוחות דרך שיווק ברשתות, ביטחון מול המצלמה ותמחור נכון. שיחת ייעוץ ללא עלות.",
  },
  brand: {
    name: "אליה יצחק",
    descriptor: "שיווק ומנטליות לעסקי ביוטי",
    portrait: "/media/photo/eliya-headshot.jpg",
    portraitAlt: "אליה יצחק",
  },
  navigation: [
    { href: "#about", label: "עליי" },
    { href: "#method", label: "איך זה עובד" },
    { href: "#proof", label: "תוצאות" },
    { href: "#offer", label: "השיחה" },
    { href: "#contact", label: "יצירת קשר" },
  ],
  navigationLabel: "ניווט ראשי",
  footerNavigationLabel: "ניווט בתחתית העמוד",
  menuLabel: "תפריט",
  closeLabel: "סגירה",
  skipLabel: "דלגי לתוכן",
  social: [
    {
      id: "instagram",
      label: "אינסטגרם",
      href: "https://www.instagram.com/eliya_thebeautybrand/",
    },
    {
      id: "whatsapp",
      label: "וואטסאפ",
      href: "https://api.whatsapp.com/send/?phone=972547893950&text=%D7%94%D7%99%D7%99+%D7%90%D7%A9%D7%9E%D7%97+%D7%9C%D7%A9%D7%9E%D7%95%D7%A2+%D7%A2%D7%95%D7%93+%D7%A4%D7%A8%D7%98%D7%99%D7%9D+%D7%A2%D7%9C+%D7%94%D7%9C%D7%99%D7%95%D7%95%D7%99+%D7%A9%D7%99%D7%95%D7%95%D7%A7&type=phone_number&app_absent=0",
    },
  ],
  hero: {
    /*
     * ── THE HEADLINE SELLS THE PLEASURE ──
     * Daniel's standard, 2026-08-05: the main heading talks about the problem
     * OR the pleasure, and every line break is the end of a finished sentence.
     *
     * Pleasure was the right half here because the PROBLEM already owns the
     * next section but one: `pain.title` is "את מקצוענית. פשוט לא מכירים
     * אותך." Opening on the problem too would say the same thing twice inside
     * one screen of scrolling.
     *
     * Two lines, each a complete sentence, each short enough to hold its own
     * line at 390px.
     */
    titleLines: ["היומן שלך יכול להיות מלא.", "בלי לרדוף אחרי אף לקוחה."],
    /*
     * ── THE SUB-HEADLINE ANSWERS THE OBJECTIONS ──
     * Same instruction: the secondary heading handles what she thinks will
     * stop this working for her. These three are the objections that actually
     * arrive, and every one of them is answered later on the page:
     *
     *   "אני לא אוהבת להצטלם"  → the mental pillar, and FAQ 3
     *   "ניסיתי ולא עבד"        → the proof gallery
     *   "אין לי זמן"            → FAQ 2
     *
     * ⚠️ This slot used to hold her bio ("אני אליה, מאמנת שיווקית..."). That
     * is not what a sub-headline is for, and it is now the opening line of
     * About, one section down, where it belongs.
     */
    /* ⚠️ NO FULL STOPS. Daniel, 2026-08-06: *"In the secondary headers we don't
       want the dots at the end of sentences."* Same rule as the headings: the
       line break already ends the thought, so the mark is redundant. */
    subheadLines: [
      "גם אם את שונאת להצטלם",
      "גם אם ניסית לפרסם וזה לא הביא כלום",
      "וגם אם אין לך זמן להתעסק עם זה כל היום",
    ],
    description:
      "אני אליה, מאמנת שיווקית ומנטלית לעסקי ביוטי. אני עוזרת לך להביא לקוחות חדשות בלי לרדוף אחריהן, עם תוכן שמייצר פניות, ביטחון לצאת מול המצלמה, ומחיר שמכבד את העבודה שלך.",
    /*
     * ⚠️ NOT THE SAME STRING AS `offer.cta`. Both buttons said "לשיחה איתי, ללא
     * עלות" until 2026-08-06, which is the failure mode described in
     * `ui/section-cta.tsx`: a label repeated down a page stops being read.
     *
     * Daniel set this one himself: *"The CTA right after the hero video should
     * be something like 'גם אני רוצה להצליח'."* It is the reader's own sentence
     * rather than a description of what the button does, which is why it works
     * directly under sixty seconds of someone else succeeding.
     */
    primaryCta: "גם אני רוצה להצליח",
    secondaryCta: "קודם תראי לי תוצאות",
    video: {
      src: "/media/video/hero-a.mp4",
      poster: "/media/video/hero-a-poster.jpg",
      label: "אליה מסבירה מה מפריד בינך לבין ההצלחה שלך",
    },
    /*
     * ⚠️ THIS SLOT USED TO EXPLAIN THE PLAYER TO ITSELF: *"הסרטון מתנגן בלי
     * סאונד. אפשר להפעיל קול בכל רגע."* Daniel, 2026-08-06: *"Remove this
     * bullshit line. You can replace it with something about her that could be
     * more appealing in marketing."*
     *
     * He is right about more than the tone. The line was answering a question
     * nobody had asked, in the most valuable strip of copy on the page — the
     * sentence directly under the primary button. The player already says what
     * it does: the unmute sheet is labelled, and the sound control is on the
     * frame. Describing the interface a second time in prose bought nothing.
     *
     * What replaces it does the job that slot is for: one line of hers that
     * makes pressing the button feel less like a risk.
     */
    videoHint: "היא לא הגיעה לכאן ממקום אחר. היא ישבה בדיוק איפה שאת יושבת עכשיו.",
    /*
     * ── THE LINE INSIDE THE FRAME, ABOVE THE CLIP ──
     * Daniel, 2026-08-07: *"I like what we did in Pnina, where above the video
     * in the same rectangle as the video we have something like 'צפי בסרטון עד
     * הסוף👇🏻'."*
     *
     * Pnina passes this as `caption` into `HeroVideo` and it renders in a band
     * inside the mount, above the `aspect-video` box — so it reads as part of
     * the player rather than as a paragraph that happens to sit above it. Same
     * placement here. His wording.
     */
    videoCaption: "הסרטון הזה במיוחד בשבילך 👇",
    playLabel: "הפעלה",
    playWithSoundLabel: "הפעלה עם קול",
    pauseLabel: "עצירה",
    muteLabel: "השתקה",
    fullscreenLabel: "מסך מלא",
  },
  about: {
    titleLines: ["נעים להכיר, אני אליה"],
    paragraphs: [
      "אני מלווה בעלות עסקים בתחום הביוטי. לק ג'ל, בניית ציפורניים, עיצוב והרמת גבות וקוסמטיקה. את התחום הזה אני מכירה מבפנים, ואני יודעת בדיוק איפה נשברות.",
      "העבודה איתי היא לא רק טיפים לשיווק. היא גם החלק שאף אחד לא מדבר עליו: הפחד להיראות, הקושי לבקש כסף, והתחושה שאת מפריעה כשאת מפרסמת את עצמך.",
      "המטרה שלי פשוטה. שהיומן שלך יהיה מלא, שתגבי מחיר שמכבד אותך, ושתפסיקי להרגיש שאת רודפת אחרי לקוחות.",
    ],
    image: "/media/photo/eliya-about.jpg",
    imageAlt: "אליה על חוף הים בשעת שקיעה",
    imageCaption: "הרגע שבו הבנתי שאפשר גם לחלום בגדול",
    cta: { label: "בואי נכיר גם אני ואת", href: "#contact" },
  },
  pain: {
    /* Daniel named this one: two sentences, two lines, split at the full stop
       and not at wherever a 720px box happens to end. */
    titleLines: ["את מקצוענית.", "פשוט לא מכירים אותך."],
    description:
      "רוב בעלות עסקי הביוטי שמגיעות אליי לא צריכות עוד קורס מקצועי. הידיים שלהן מצוינות. מה שחסר זה שמישהי בחוץ תדע שהן קיימות.",
    items: [
      {
        id: "empty-calendar",
        icon: "calendar",
        text: "היומן חצי ריק, ואת ממלאת אותו בהנחות",
        emphasis: "ממלאת אותו בהנחות",
      },
      {
        id: "price-fear",
        icon: "money",
        text: "את מפחדת להעלות מחיר כי אולי הן יעלמו",
        emphasis: "מפחדת להעלות מחיר",
      },
      {
        id: "no-replies",
        icon: "silent-phone",
        text: "את מעלה סטורי ואף אחת לא פונה",
        emphasis: "אף אחת לא פונה",
      },
      {
        id: "camera-shy",
        icon: "camera",
        text: "את יודעת שצריך להצטלם, ומרגישה לא בנוח מול המצלמה",
        emphasis: "לא בנוח מול המצלמה",
      },
      {
        id: "more-hours",
        icon: "hourglass",
        text: "את עובדת יותר שעות ומרוויחה פחות",
        emphasis: "יותר שעות ומרוויחה פחות",
      },
      {
        id: "comparison",
        icon: "comparison",
        text: "את רואה אחרות עם פחות ניסיון ממך מלאות בעבודה",
        emphasis: "פחות ניסיון ממך",
      },
    ],
    /* Daniel's own line, 2026-08-06. Mine was "תפסיקי להיות הסוד הכי שמור",
       which he called horrible: it names the problem again at the exact moment
       the reader is being offered the way out of it. His names the outcome. */
    cta: { label: "בואי נהפוך אותך לויראלית", href: "#contact" },
  },
  method: {
    /* ⚠️ ONE LINE. This is one sentence, and it was split across two purely
       because the mechanism allowed it. Daniel: *"Why do headers on desktop at
       least like this one ['מה קרה אצל מי שעבדה איתי'] splitted to two lines
       and not in a single line?"* The array is for SENTENCES, not for breaking
       a phrase in half. */
    titleLines: ["שלושה דברים שמשנים את התמונה"],
    description:
      "לא נוסחה קסומה. עבודה על שלושה מישורים שמזיזים אחד את השני, כי שיווק בלי ביטחון לא יוצא לפועל, וביטחון בלי מחיר נכון לא משאיר לך כסף.",
    items: [
      {
        id: "marketing",
        icon: "target",
        title: "שיווק שמביא פניות",
        description:
          "מה לצלם, מתי להעלות, ואיך לבנות תוכן שגורם ללקוחה לכתוב לך, במקום לאסוף לייקים מחברות.",
      },
      {
        id: "mindset",
        icon: "spark",
        title: "ביטחון מול המצלמה",
        description:
          "החלק המנטלי. לצאת לסטורי בלי להרגיש שאת מפריעה למישהו, ולהפסיק להתנצל על זה שיש לך עסק.",
      },
      {
        id: "pricing",
        icon: "crown",
        title: "מחיר שמכבד את העבודה",
        description:
          "להבין כמה את שווה, להעלות מחיר בלי לאבד את הלקוחות הקיימות, ולעבוד פחות שעות על אותה הכנסה.",
      },
    ],
    cta: { label: "אני רוצה שיקרה לי את זה", href: "#contact" },
  },
  /*
   * ── THE SCROLL JOURNEY ──
   * Ported from Pnina's `process` section at Daniel's instruction, 2026-08-05:
   * *"There is still now the animation section, which I wanted to copy over
   * from Pnina. In Core Repo it is the process section […] Give a new
   * animation but the core of the animation should be here at least for now
   * with the images from there and videos and we will change it as I decide."*
   *
   * ⚠️ THE COPY IS REAL, THE FOOTAGE IS NOT. These four steps are her actual
   * funnel and can stay. The clip behind them is Pnina's pearl film and is a
   * PLACEHOLDER — it is a jewellery product film and has nothing to do with a
   * beauty coach. `mediaPlaceholderNote` says so on screen so it cannot be
   * mistaken for finished work, and both go the moment Daniel decides what the
   * real animation is.
   *
   * Short lines, no full stops at line ends. The `*…*` markers set apart the
   * two or three words that carry each line.
   */
  process: {
    titleLines: ["איך זה עובד.", "שלב אחרי שלב."],
    steps: [
      {
        title: "את עושה את הצעד הראשון",
        lines: [
          "משאירה *שם וטלפון*",
          "זה כל מה שצריך כרגע",
          "בלי טפסים ארוכים ובלי התחייבות",
        ],
      },
      {
        title: "אנחנו מדברות",
        lines: [
          "שיחה אחת, *ללא עלות*",
          "נבין איפה העסק שלך נמצא",
          "ומה הדבר שתקוע באמת",
        ],
      },
      {
        title: "בונות לך תוכנית",
        lines: [
          "מה לצלם, מתי להעלות",
          "ואיזה מחיר *מכבד אותך*",
          "מותאם ליומן שלך, לא לשל מישהי אחרת",
        ],
      },
      {
        title: "היומן מתחיל להתמלא",
        lines: [
          "פניות מגיעות *מהתוכן שלך*",
          "את גובה מחיר בלי להתנצל",
          "ועובדת פחות שעות על אותה הכנסה",
        ],
      },
    ],
    progressLabel: "שלב {current} מתוך {total}",
    endpoint: "מכאן זה כבר העסק שלך",
    mediaPlaceholderNote:
      "הרקע כאן הוא סרטון זמני מפרויקט אחר, עד שנחליט מה נכנס במקומו",
    cta: { label: "יאללה, מתחילות משלב אחת", href: "#contact" },
  },
  stats: {
    titleLines: ["מה קרה אצל מי שעבדה איתי"],
    description:
      "המספרים לקוחים מהודעות ומצילומי מסך של לקוחות. כל אחד מהם מופיע בגלריה שמתחת, כמו שהוא נשלח.",
    items: [
      {
        id: "zero-to-ten",
        value: "₪10,000",
        label: "בחודש קבוע, אחרי שהתחילה מאפס",
        evidence: "t02",
      },
      {
        id: "views",
        value: "120 אלף",
        label: "צפיות לסרטון אחד של לקוחה",
        evidence: "t11",
      },
      {
        id: "three-months",
        value: "3 חודשים",
        label: "מראש. ככה נסגר היומן שלה",
        evidence: "t05",
      },
      {
        id: "reach-jump",
        value: "131 אלף",
        label: "צפיות לסרטון, אחרי תקרה של 400",
        evidence: "t08",
      },
    ],
    cta: { label: "אני רוצה מספרים כאלה בעסק שלי", href: "#contact" },
  },
  proof: {
    titleLines: ["בלי סיפורים.", "ההודעות עצמן."],
    cta: { label: "תורי להיות בצילום מסך כזה", href: "#contact" },
    /*
     * ⚠️ TWO LINES, AND THE SECOND IS A PARENTHETICAL. Daniel's own copy,
     * 2026-08-07. It replaces "בלי עריכה ובלי ניסוח מחדש. ההודעות כפי שהן
     * נשלחו." — a line that described the EVIDENCE HANDLING rather than saying
     * anything to the reader. His turns the wall of other people's results into
     * an invitation.
     *
     * ⚠️ "סיפור ההצלחה הבא", not "הסיפור הצלחה הבא". He typed the latter; it is
     * a smichut construction, so the definite article goes on the second noun.
     * Corrected rather than reproduced, because it ships in 48px type.
     */
    descriptionLines: [
      "את יכולה להיות סיפור ההצלחה הבא",
      "(אני ממש רוצה לעזור לך 🙏)",
    ],
    /*
     * ⚠️ THESE ARE NOW SCREEN-READER ONLY, NOT VISIBLE HEADINGS. Daniel,
     * 2026-08-06: *"why in the gallery section did you actually write, on the
     * first section, 'screenshots from conversation' and then in the second 'in
     * video'? It's fucking obvious only AI would need it. The user obviously
     * sees and knows what a video is and what screenshots are."*
     *
     * He is right about the visible label and the strings still have to exist:
     * each track is a focusable scroll region, and a focusable region without
     * an accessible name is an axe `scrollable-region-focusable` failure and an
     * unlabelled tab stop. So they stay in the DOM, visually hidden, doing the
     * only job they were ever actually needed for.
     */
    stillsLabel: "צילומי מסך מהשיחות",
    mediaLabel: "סרטונים",
    previousLabel: "הקודם",
    nextLabel: "הבא",
    positionLabel: "מעבר לפריט",
    expandLabel: "להגדלה",
    closeLabel: "סגירה",
    items: [
      {
        id: "t01",
        media: { kind: "image", src: "/media/proof/t01.jpg" },
        alt: "צילום מסך של שיחת וואטסאפ עם לינוי, בעלת עסק למיקרובליידינג",
        caption: "מעסק עם לקוחה אחת בשבוע, לסגירת עסקאות ופניות קבועות",
      },
      {
        id: "t02",
        media: { kind: "image", src: "/media/proof/t02.jpg" },
        alt: "צילום מסך של שיחה באינסטגרם עם איילה נבו",
        caption: "איילה: מאפס בחודש ל 10,000 שקל בחודש קבוע, תוך שלושה חודשים",
      },
      /*
       * ⚠️ BOTH CLIPS LIVE HERE, and that restores the frozen decision in
       * INTAKE.md §"Hero video": *"Both are displayed."* The hero shows hero-a
       * only, because two autoplaying clips in one fold means neither gets
       * watched. This gallery is where the second one plays, on demand, and it
       * is also what gives the media track something to be a track OF.
       *
       * hero-b pairs with t02: it names איילה, who is the client in that
       * screenshot.
       */
      {
        id: "video-separates",
        media: {
          kind: "video",
          src: "/media/video/hero-a.mp4",
          poster: "/media/video/hero-a-poster.jpg",
        },
        alt: "אליה מסבירה מה מפריד בינך לבין ההצלחה שלך",
        caption: "מה באמת מפריד בינך לבין היומן שאת רוצה",
      },
      {
        id: "video-ayala",
        media: {
          kind: "video",
          src: "/media/video/hero-b.mp4",
          poster: "/media/video/hero-b-poster.jpg",
        },
        alt: "אליה מספרת על איילה",
        caption: "אליה מספרת בעצמה על התהליך של איילה",
      },
      {
        id: "t03",
        media: { kind: "image", src: "/media/proof/t03.jpg" },
        alt: "צילום מסך של פניות שהתקבלו בתיבת ההודעות באינסטגרם",
        caption: "פניות לקורס עיצוב גבות שמגיעות ישירות מהתוכן",
      },
      {
        id: "t04",
        media: { kind: "image", src: "/media/proof/t04.jpg" },
        alt: "צילום מסך של שיחה עם בעלת סלון ציפורניים",
        caption: "קרוב ל 5,000 שקל בחודש מהבית, אחרי שלושה חודשים בלי 1,000",
      },
      {
        id: "t05",
        media: { kind: "image", src: "/media/proof/t05.jpg" },
        alt: "צילום מסך של שיחה על יומן שנסגר מראש",
        caption: "לקוחות שמשריינות תור שלושה חודשים מראש",
      },
      {
        id: "t06",
        media: { kind: "image", src: "/media/proof/t06.jpg" },
        alt: "צילום מסך של סרטון עם 43.8 אלף צפיות",
        caption: "43.8 אלף צפיות, ולקוחה חדשה שנוסעת מרחוק בעקבות הסרטון",
      },
      {
        id: "t07",
        media: { kind: "image", src: "/media/proof/t07.jpg" },
        alt: "צילום מסך של הודעה על פניות שהגיעו אחרי סטורי",
        caption: "פניות ללק ג'ל שהגיעו מסטורי אחד",
      },
      {
        id: "t08",
        media: { kind: "image", src: "/media/proof/t08.jpg" },
        alt: "צילום מסך של נתוני צפיות בסרטונים באינסטגרם",
        caption: "מתקרה של 400 צפיות, ל 28.4 אלף, 127 אלף ו 131 אלף",
      },
      {
        id: "t09",
        media: { kind: "image", src: "/media/proof/t09.jpg" },
        alt: "צילום מסך של נתוני חשיפה באינסטגרם",
        caption: "32 אלף צפיות, 30 עוקבות חדשות מסרטון אחד, חשיפה של 200 אלף",
      },
      {
        id: "t10",
        media: { kind: "image", src: "/media/proof/t10.jpg" },
        alt: "צילום מסך של שיחה על עלייה בצפיות ובפניות",
        caption: "עלייה בצפיות ובתגובות, ופנייה ישירה מהסטורי",
      },
      {
        id: "t11",
        media: { kind: "image", src: "/media/proof/t11.jpg" },
        alt: "צילום מסך של סרטון עם 120 אלף צפיות",
        caption: "120 אלף צפיות, 3,042 לייקים ו 140 תגובות לסרטון אחד",
      },
    ],
  },
  testimonials: {
    titleLines: ["מה הן אומרות אחרי שזה קרה להן"],
    items: [
      {
        id: "rm",
        quote:
          "הגעתי לאליה כשהייתי מיואשת לגמרי. תוך חודש של עבודה על הביטחון, ושיווק ברשתות היומן שלי התמלא בלקוחות חדשות אחרי שהעליתי מחיר.",
        attribution: "ר.מ",
      },
      {
        id: "ns",
        quote:
          "תמיד פחדתי להעלות מחירים. אליה נתנה לי את הביטחון להבין כמה אני שווה. היום אני מרוויחה פי 2 בפחות שעות עבודה.",
        attribution: "נ.ש",
      },
      {
        id: "lk",
        quote:
          "בתור מישהי שבחיים לא חשבה להצטלם, אליה הראתה לי איך להביא לקוחות בלי להרגיש פדחנית. וזה עבד מטורף.",
        attribution: "ל.כ",
      },
    ],
    cta: { label: "גם עליי ידברו ככה", href: "#contact" },
  },
  offer: {
    /*
     * ⚠️ FOURTH VERSION, AND THE FIRST ONE NOT ABOUT MONEY.
     *
     * It has been "השיחה איתי", then "השיחה איתי / בלי מצגת ובלי לחץ", then
     * "בדרך כלל זה עולה כסף / בשבילך זה לא". Daniel, 2026-08-07: *"in the header
     * replace it entirely with something else unrelated to the fact it costs
     * money, something in the style of stuff i wrote in this prompt to you."*
     *
     * The style he means is the register of his own lines in that message —
     * "בגלל שאני ממש רוצה שתצליחי", "אני ממש רוצה לעזור לך": first person, warm,
     * and about HER wanting it rather than about what the reader gets. The
     * struck prices underneath already make the money argument; the heading does
     * not need to make it a second time in the largest type on the panel.
     */
    titleLines: ["אני רוצה לראות אותך מצליחה", "בואי נדבר על זה"],
    /*
     * ⚠️ "בלי מצגת ובלי לחץ" WAS IN THE HEADING AND IN THIS SENTENCE, one line
     * apart. Daniel, 2026-08-06: *"this header needs to be rewritten: 'השיחה
     * איתי / בלי מצגת ובלי לחץ.בלי מצגת ובלי לחץ'."*
     *
     * The phrase is good and it earns its place in the heading, where it is the
     * promise. Repeating it as the last clause of the sentence directly beneath
     * made the panel read as though it had stuttered. Cut from here, kept there.
     */
    description:
      "נבין איפה העסק שלך נמצא עכשיו, מה באמת תקוע, ומה הדבר הראשון שכדאי לשנות.",
    rungs: [
      { label: "המחיר הרגיל לשיחת אבחון", price: "₪1,090" },
      { label: "המחיר לנשים שמגיעות דרך האתר", price: "₪419" },
    ],
    /* Daniel's line, 2026-08-07, replacing "היום, בשבילך". Same register as the
       heading above it: the reason the call is free is that she wants the
       result, not that there is a promotion running. */
    /* ⚠️ "במתנה", NOT "מתנה". Daniel, 2026-08-07. The bare noun makes the call
       the direct object of a second verb — "אני נותנת לך אותה מתנה" reads as
       giving you *it, a gift*, two objects stacked. "ב־" turns it into the
       adverbial "as a gift", which is what the sentence means and the form the
       phrase actually takes in Hebrew. */
    freeLabel: "בגלל שאני ממש רוצה שתצליחי אני נותנת לך אותה במתנה",
    /* The one place on the page where the button says exactly what it is. Every
       other invitation is the reader's own sentence; this is the transaction. */
    cta: "לשיחה איתי, ללא עלות",
  },
  faq: {
    titleLines: ["שאלות שחוזרות כמעט בכל שיחה"],
    items: [
      {
        question: "אני רק בתחילת הדרך. זה מתאים לי?",
        answer:
          "כן. חלק מהלקוחות שלי הגיעו בלי אף לקוחה קבועה. דווקא בהתחלה קל יותר לבנות הרגלי שיווק נכונים, לפני שנתקעים בשגרה שלא עובדת.",
      },
      {
        question: "אין לי זמן לצלם כל היום",
        answer:
          "ולא צריך. אנחנו בונות שגרת תוכן שמתאימה ליומן שלך ולכמות השעות שיש לך בפועל, לא לתוכנית של מישהי אחרת.",
      },
      {
        question: "אני ממש לא אוהבת להצטלם",
        answer:
          "זה הדבר הכי נפוץ ששומעים ממני בשיחה הראשונה. החלק המנטלי של הליווי קיים בדיוק בשביל זה, ואנחנו מתקדמות בקצב שלך.",
      },
      {
        question: "כמה זמן לוקח עד שרואים שינוי?",
        answer:
          "זה משתנה מעסק לעסק ותלוי בכמה את מיישמת. בשיחה נדבר בכנות על מה סביר לצפות במצב הספציפי שלך, בלי הבטחות.",
      },
      {
        question: "מה קורה בשיחה?",
        answer:
          "משאירה שם וטלפון, ואני חוזרת אלייך. נדבר על העסק, על מה תקוע, ואם אני חושבת שאני יכולה לעזור, אספר לך איך. בלי לחץ.",
      },
    ],
    cta: { label: "נשארה לי שאלה אחת, בואי נדבר", href: "#contact" },
  },
  contact: {
    /*
     * ⚠️ IT READ "בואי נדבר. אחת על אחת." AND BOTH SENTENCES WERE WRONG.
     * Daniel, 2026-08-07: *"I don't like the 'בואי נדבר אחת על אחת'. The term
     * 'one-on-one' doesn't sound good in Hebrew."*
     *
     * "אחת על אחת" is a loan translation. English says one-on-one because it
     * needs a word for the thing; Hebrew already has the concept inside "שיחה"
     * and the calque lands somewhere between a sports broadcast and a corporate
     * deck. Nothing was gained by it either — `description` one line below
     * already says she is the one calling.
     *
     * The first sentence had a second, separate fault: "בואי נדבר" was ALREADY
     * on the page twice — the offer heading ends *"בואי נדבר על זה"* and the FAQ
     * closes with *"נשארה לי שאלה אחת, בואי נדבר"*, and that FAQ button links
     * HERE. So the last thing read before this heading and the heading itself
     * were the same three words, one scroll apart.
     *
     * "מכאן מתחילים" is short enough for the narrowest heading slot on the page
     * (see `.contact__pitch .section__title`), is not a translation of anything,
     * and points forwards at the form rather than back at the invitation.
     */
    titleLines: ["מכאן מתחילים"],
    /*
     * ⚠️ THIS SENTENCE WAS WRITTEN BY SOMEONE TRANSLATING A FORM, NOT BY A
     * PERSON. It read *"משאירה שם וטלפון, ואני חוזרת אלייך לשיחה ללא עלות ובלי
     * התחייבות."* Daniel, 2026-08-06: *"Which would never be used, would never
     * be taught about, and nobody would ever use that sentence in Hebrew when
     * he wants to try to write content for an ending page."*
     *
     * He is right, and the diagnosis is specific: "ללא עלות ובלי התחייבות" is
     * TERMS-AND-CONDITIONS language. It answers a legal question at the exact
     * moment the reader is deciding an emotional one, and it makes the last
     * sentence of the page sound like the bottom of a contract. That phrase is
     * off the page entirely now — the button beneath the form is labelled
     * "לשיחה ללא עלות", which is the one place the reader needs it.
     *
     * What replaces it names what the call is FOR. His own suggestion.
     */
    description:
      "משאירה שם וטלפון, ואני מתקשרת אלייך לשיחה שיכולה לשנות לך את העסק.",
    /*
     * ⚠️ THE PHONE-AND-BLAZER PORTRAIT, AND IT WAS NOT ON THE PAGE AT ALL.
     * INTAKE.md calls `eliya-phone-blazer.jpg` the *"best available"* image she
     * has — black blazer, phone in hand, on message — and it was sitting unused
     * in the repo while the last section of the funnel had no face in it.
     * This is the moment a visitor decides whether to hand over a phone number,
     * which is the worst possible place to be talking to nobody.
     */
    portrait: "/media/photo/eliya-portrait.jpg",
    portraitAlt: "אליה יצחק עם הטלפון ביד",
    /*
     * ⚠️ THREE TICKED LINES USED TO SIT HERE AND ALL THREE WERE ALREADY SAID.
     * Daniel, 2026-08-07: *"we should remove these three check marks because the
     * text above them, the one under the headline that I mentioned here, says
     * exactly the same thing. Just a duplicate and unnecessary."*
     *
     * Line by line, against `description` — "משאירה שם וטלפון, ואני מתקשרת
     * אלייך לשיחה שיכולה לשנות לך את העסק":
     *   · "שם וטלפון בלבד"                → the sentence opens with those exact
     *     two words, and `labels.privacy` under the form says it a third time.
     *   · "אני חוזרת אלייך אישית, לא מוקד" → "ואני מתקשרת אלייך" is the same
     *     promise; the first person IS the "not a call centre" part.
     *   · "השיחה ללא עלות ובלי התחייבות"   → the button one column across reads
     *     "לשיחה ללא עלות", and this is the phrasing he had already rejected
     *     once as contract language (see the note on `description`).
     *
     * Three ticks that restate the line above them do not read as three
     * reassurances. They read as padding, and they push the form down the
     * screen — the one element in this section anyone is meant to reach.
     */
    labels: {
      name: "שם",
      phone: "טלפון",
      submit: "שלחי לי פרטים",
      submitting: "שולחת",
      /*
       * ⚠️ A NOTE TO OURSELVES THAT LEAKED INTO THE INTERFACE. It read *"הפרטים
       * משמשים ליצירת קשר בלבד. טיוטת מדיניות פרטיות, תעודכן לפני ההשקה."*
       * Daniel: *"What the fuck is this sentence about?"*
       *
       * Fair. The second half was a BUILD STATUS — a message from us to us,
       * printed under a form a stranger is being asked to trust, telling her the
       * page she is on is not finished. The draft state is real and it still
       * blocks release; it is tracked in INTAKE.md (O-16), which is where a
       * build status belongs. It is not the visitor's problem.
       */
      privacy: "השם והטלפון נשארים אצלי בלבד, ומשמשים רק כדי לחזור אלייך.",
      success: "קיבלתי. אחזור אלייך בהקדם.",
      error: "לא הצלחנו לשלוח. אפשר לנסות שוב או לפנות בוואטסאפ.",
    },
  },
  /* ⚠️ RENAMED FROM `mobileCta` on 2026-08-07. The `mobile-cta` module is gone;
     this is now just the short form of the call, used by the header button and
     the footer's closing button, and the old name pointed at nothing. */
  shortCta: "לשיחה ללא עלות",
  whatsappFloatLabel: "שליחת הודעה בוואטסאפ",
  accessibility: {
    launcherLabel: "הגדרות נגישות",
    title: "נגישות",
    close: "סגירה",
    reset: "איפוס",
    textSize: "גודל טקסט",
    increase: "הגדלה",
    decrease: "הקטנה",
    contrast: "ניגודיות גבוהה",
    spacing: "ריווח מוגדל",
    motion: "עצירת אנימציות",
    links: "הדגשת קישורים",
    on: "פעיל",
    off: "כבוי",
  },
  /*
   * ── THE COOKIE NOTICE, REWRITTEN TO DANIEL'S HOUSE PATTERN ──
   * 2026-08-06: *"This cookies popup is really not up to my standards […] check
   * what I have in place for my website, which is automations-website and
   * pnina-website. Where we have the nice cookies image and then the text is
   * thoughtful and funny and engaging for people to press and use."*
   *
   * Both of those sites say one playful line and offer two plain buttons:
   *   pnina        "מי לא אוהבת עוגיות? רוצה אחת?"  ·  כן, תודה / לא תודה
   *   automations  "מי לא אוהב עוגיות? רוצים אחת?"  ·  כן, תודה / לא תודה
   *
   * He asked for a beauty-specific variant rather than a copy, so this one is
   * built on the joke that belongs to this audience: the calories. It also
   * happens to be literally true about this site, which is the part that keeps
   * it from being only a joke — there is no tracking here to consent to.
   *
   * ⚠️ THE THREE-SENTENCE PARAGRAPH IS GONE, NOT SHORTENED. It explained
   * cookieless measurement and localStorage to someone who came here to look at
   * nail work. That explanation is correct and it is still available, in full,
   * one link away on the privacy page, which is where a person who wants it
   * will go looking.
   */
  cookies: {
    title: "עוגיות",
    /* ⚠️ SECOND ATTEMPT. The first read "עוגייה אחת, בלי קלוריות ובלי מעקב" and
       Daniel, 2026-08-06: *"more for gym goers and not the beauty industry."*
       Right: calorie-counting is diet-culture register, not salon register. The
       joke has to come from HER world, so it comes from the manicure. */
    body: "עוגייה קטנה? מבטיחה שהיא לא תהרוס לך את המניקור.",
    accept: "כן, תודה",
    decline: "לא תודה",
    privacyLabel: "מידע נוסף",
  },
  /*
   * ⚠️ THESE THREE PAGES DID NOT EXIST. The site linked to a privacy policy
   * from the contact form's fine print and there was no privacy policy, and an
   * accessibility statement is a legal requirement in Israel for a business
   * site. Both were release blockers that nothing in the repo recorded.
   *
   * Everything below describes what this site ACTUALLY does — measured against
   * the Worker contract and the analytics config, not against what was planned.
   * The gaps that need her real business details are marked, not invented.
   */
  legal: {
    backLabel: "חזרה לעמוד הראשי",
    navLabel: "עמודי מידע",
    updatedLabel: "עודכן",
    updatedAt: "05.08.2026",
    pages: {
      privacy: {
        slug: "privacy",
        title: "מדיניות פרטיות",
        description: "איזה מידע נאסף באתר הזה, למה, וכמה זמן הוא נשמר.",
        draftNote:
          "טיוטה. הפרטים המשפטיים של העסק טרם התקבלו, והעמוד יושלם לפני ההשקה.",
        sections: [
          {
            heading: "מה נאסף",
            paragraphs: [
              "רק מה שאת מקלידה בטופס: שם וטלפון. אין באתר שדות נוספים, ואין איסוף של כתובת מייל, כתובת מגורים או פרטי תשלום.",
              "הפרטים נשלחים לשרת של האתר ומשם למערכת שממנה אליה חוזרת אלייך. הם משמשים ליצירת קשר בלבד, ולא נמכרים ולא מועברים לגורם שלישי לצורכי פרסום.",
            ],
          },
          {
            heading: "עוגיות ומדידה",
            paragraphs: [
              "האתר לא מציב עוגיות מעקב ואין בו תג של גוגל. מדידת התנועה, כשהיא פעילה, נעשית בלי עוגיות ובלי מזהה אישי, ולכן היא לא נשענת על הסכמה.",
              "הבחירה שלך בהודעת העוגיות וההעדפות בתפריט הנגישות נשמרות מקומית בדפדפן שלך בלבד. הן לא נשלחות לשום מקום ואפשר למחוק אותן בכל רגע דרך הגדרות הדפדפן.",
            ],
          },
          {
            heading: "הזכויות שלך",
            paragraphs: [
              "אפשר לבקש לראות את הפרטים שנשמרו עלייך, לתקן אותם או למחוק אותם. פנייה בוואטסאפ למספר שמופיע באתר מספיקה.",
            ],
          },
        ],
      },
      terms: {
        slug: "terms",
        title: "תנאי שימוש",
        description: "מה האתר הזה מציע ומה הוא לא מבטיח.",
        draftNote:
          "טיוטה. שם הישות המשפטית ומספר העוסק טרם התקבלו, והעמוד יושלם לפני ההשקה.",
        sections: [
          {
            heading: "מה מוצע כאן",
            paragraphs: [
              "האתר מציע שיחת היכרות ללא עלות. השארת שם וטלפון היא בקשה ליצירת קשר, ולא רכישה ולא התחייבות של אף צד.",
            ],
          },
          {
            heading: "תוצאות",
            paragraphs: [
              "המספרים והציטוטים באתר הם תיאור של מה שקרה אצל לקוחות מסוימות, כפי שהן עצמן דיווחו. הם לא הבטחה לתוצאה דומה. תוצאה בעסק תלויה בשוק, בתחום, ובעיקר בכמה מיישמים בפועל.",
            ],
          },
          {
            heading: "תכנים באתר",
            paragraphs: [
              "הטקסטים, הצילומים והסרטונים באתר שייכים לאליה יצחק ולמי שהעניקו לה רשות להשתמש בהם. אין להעתיק אותם או לפרסם אותם מחדש בלי אישור.",
            ],
          },
        ],
      },
      accessibility: {
        slug: "accessibility",
        title: "הצהרת נגישות",
        description: "מה נעשה כדי שהאתר יהיה שמיש לכל אחת, ואיך לדווח על תקלה.",
        draftNote:
          "טיוטה. שם בעל העסק לצורכי ההצהרה ופרטי רכז הנגישות טרם התקבלו, והעמוד יושלם לפני ההשקה.",
        sections: [
          {
            heading: "מה נעשה באתר",
            paragraphs: [
              "האתר נבנה לפי הנחיות WCAG 2.1 ברמה AA. כל צבעי הטקסט נמדדו מול הרקעים שעליהם הם יושבים, ולא הוערכו בעין.",
              "אפשר להפעיל את כל האתר מהמקלדת, לכל התמונות יש טקסט חלופי, והמבנה בנוי בכותרות ובאזורי תוכן כך שקורא מסך יכול לנווט בו.",
              "בתפריט הנגישות שבפינת המסך אפשר להגדיל טקסט, להגביר ניגודיות, להרחיב ריווח, להדגיש קישורים ולעצור את כל האנימציות באתר.",
              "התוכן המרכזי והטופס עובדים גם בלי JavaScript, בלי וידאו ובלי אנימציות.",
            ],
          },
          {
            heading: "מה עדיין לא מושלם",
            paragraphs: [
              "חלק מהתוכן הוא צילומי מסך של שיחות. הטקסט שבתוך התמונה לא נקרא על ידי קורא מסך, ולכן לכל צילום יש תיאור וכיתוב שמסבירים מה כתוב בו.",
            ],
          },
          {
            heading: "דיווח על בעיה",
            paragraphs: [
              "אם נתקלת במשהו באתר שלא עבד עבורך, אפשר לכתוב בוואטסאפ למספר שמופיע באתר. כל פנייה נבדקת.",
            ],
          },
        ],
      },
    },
  },
  footer: {
    statement: "מלווה בעלות עסקי ביוטי למלא את היומן, להעלות מחיר, ולהיות ויראלית ומצליחה.",
    rights: "כל הזכויות שמורות",
  },
} satisfies SiteContent;

export const siteContent: Record<Locale, SiteContent> = { he };
export const enabledLocales = generatedSiteConfig.locales as readonly Locale[];

export function isLocale(value: string): value is Locale {
  return enabledLocales.includes(value as Locale);
}

export function getSiteContent(locale: Locale): SiteContent {
  return siteContent[locale];
}
