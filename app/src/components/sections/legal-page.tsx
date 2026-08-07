import { Container } from "@foundation/ui";

import type { SiteContent } from "@/content";
import { siteUrl } from "@/lib/site-url";
import { localeHref } from "@/lib/locale-href";

type LegalKey = keyof SiteContent["legal"]["pages"];

/**
 * The shared body of the three standing pages.
 *
 * ⚠️ `draftNote` RENDERS AS A VISIBLE BANNER AND THAT IS THE POINT. Two of
 * these pages need her real legal details — the entity behind the business, and
 * a named accessibility contact — and neither has been supplied. AGENTS.md is
 * explicit that unknown policies stay unresolved and block release, so the
 * honest rendering is a page that says so on its face rather than one that
 * quietly reads as finished. Delete the note in the content file when the
 * details arrive; nothing here needs to change.
 */
export function LegalPage({
  content,
  page,
}: {
  content: SiteContent;
  page: LegalKey;
}) {
  const { legal } = content;
  const doc = legal.pages[page];

  return (
    <main className="section legal" id="main-content" tabIndex={-1}>
      <Container className="ui-container--narrow">
        <a className="legal__back" href={localeHref()}>
          {legal.backLabel}
        </a>

        <hr className="rule" />
        <h1>{doc.title}</h1>
        <p className="section__lead">{doc.description}</p>

        {doc.draftNote ? (
          <p className="legal__draft" role="note">
            {doc.draftNote}
          </p>
        ) : null}

        {doc.sections.map((section) => (
          <section className="legal__section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 28)}>{paragraph}</p>
            ))}
          </section>
        ))}

        <p className="legal__updated">
          {legal.updatedLabel} {legal.updatedAt}
        </p>
      </Container>
    </main>
  );
}
