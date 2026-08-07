import { WaveText } from "./wave-text";

/**
 * Every section heading on the page, in one place.
 *
 * ── WHY THE TITLE IS AN ARRAY ──
 * Daniel's standard, restated 2026-08-06: *"We didn't follow my thing about new
 * lines where after we don't end in dots we end at the finish of the sentence
 * and then there is a new line for a new sentence. For example in this section
 * 'את מקצוענית. פשוט לא מכירים אותך.' It should be something like 'את מקצוענית'
 * first line then second: 'פשוט לא מכירים אותך'."*
 *
 * Measured before the change: `#pain-title` was one string in a 720px box, and
 * the browser broke it into two lines — at 720px, not at the full stop. Where a
 * heading breaks is a COPY decision, so it lives in the content file as one
 * finished sentence per array entry, and each entry gets its own block. The
 * browser is never asked to guess.
 *
 * ── WHY THE HEADING IS A LIVE ELEMENT ──
 * The gloss (`WaveText`) sweeps one crest of gold across the letters. It is a
 * client component, so this file stays a server component and only the letters
 * hydrate. Assistive tech reads the plain string from inside `WaveText`, so an
 * `aria-labelledby` pointing at this `id` still resolves to the real sentence.
 *
 * The trailing full stops are stripped for DISPLAY only (`stripTerminal`): a
 * line that is already the end of a line does not need a mark saying so, which
 * is the whole point of the rule. The content file keeps them for the
 * accessible string and for anywhere the title is used as flat text.
 */
export function SectionHeading({
  id,
  lines,
  lead,
  align = "start",
}: {
  id: string;
  lines: string[];
  lead?: string | string[];
  align?: "start" | "center";
}) {
  return (
    <div className="section__head" data-align={align}>
      <hr className="rule" />
      {/*
        ⚠️ ONE `WaveText` FOR THE WHOLE HEADING, NOT ONE PER LINE.

        Daniel, 2026-08-06: *"The glow in the header shouldn't be one glow on
        both lines. There should be only one single glow like in the automation
        website […] Only one glow on a header."*

        Each line used to be its own `WaveText`, so a two-line heading ran two
        independent clocks and showed two crests travelling side by side. The
        source on automations-website handles this by splitting its text on a
        newline and letting the single crest address letters by DOM ORDER — one
        crest sweeps line one, then line two, in reading order. Joining the
        lines with a newline here does exactly that.

        `label` keeps the full stops the display drops, so a screen reader still
        gets the pause between sentences.
      */}
      <h2 className="section__title" id={id}>
        <WaveText
          label={lines.join(" ")}
          text={lines.map(stripTerminal).join("\n")}
        />
      </h2>
      {lead ? (
        <p className="section__lead">
          {(Array.isArray(lead) ? lead : [lead]).map((line) => (
            <span className="section__lead-line" key={line}>
              {line}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

/** Drop a single trailing full stop; keep question and exclamation marks. */
export function stripTerminal(line: string): string {
  return line.endsWith(".") ? line.slice(0, -1) : line;
}

/** The flat sentence, for aria labels, document titles and tests. */
export function headlineText(lines: string[]): string {
  return lines.join(" ");
}
