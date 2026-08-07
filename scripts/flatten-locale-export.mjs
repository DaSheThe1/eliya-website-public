// Hoists the single-locale static export so Hebrew is served at the root.
//
// Ported from pnina-website/scripts/flatten-locale-export.mjs at Daniel's
// instruction, 2026-08-07: *"we're not doing /he. This is a Hebrew-only website
// so no need. We're going to serve it straight from
// https://eliya.trickticmedia.com/"*
//
// The App Router needs the `[locale]` segment: it is what generateStaticParams
// iterates and what every page reads its content from. So `next build` with
// `output: export` emits every page under `app/out/he/...` no matter what the
// URLs are supposed to look like. On a static host there is no middleware to
// strip that prefix, so the only place it can be removed is here, after the
// build.
//
// ⚠️ THIS IS HALF OF A PAIR. The other half is `app/src/lib/locale-href.ts`,
// which makes the links, the canonical and the sitemap unprefixed. Run this
// without that and every link in the HTML points at /he/, which will no longer
// exist. Change that without this and every link 404s. They only make sense
// together.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import process from "node:process";

const outDir = join(process.cwd(), "app", "out");
const localeDir = join(outDir, "he");

if (!existsSync(localeDir)) {
  console.error(
    "[flatten-locale-export] app/out/he not found — did the static export run? Skipping.",
  );
  process.exit(0);
}

/*
 * ⚠️ THE ROOT index.html IS REMOVED FIRST, AND ON PURPOSE.
 *
 * The foundation emits one at app/out/index.html: a noindex meta-refresh stub
 * that bounces the visitor to ./he/. That is exactly the behaviour being
 * deleted, and it is also the one file guaranteed to collide with the real home
 * page coming up from he/. Removing it by name — rather than widening the
 * collision check below — keeps the check strict for everything else.
 */
const rootStub = join(outDir, "index.html");
if (existsSync(rootStub)) {
  rmSync(rootStub);
}

for (const entry of readdirSync(localeDir)) {
  const from = join(localeDir, entry);
  const to = join(outDir, entry);
  if (existsSync(to)) {
    // No expected collisions — the root holds _next/, media/, robots.txt and
    // the like, while he/ holds the pages — but fail loudly rather than
    // silently clobber if that ever stops being true.
    throw new Error(
      `[flatten-locale-export] refusing to overwrite existing app/out/${entry}`,
    );
  }
  renameSync(from, to);
}

rmdirSync(localeDir);

/*
 * ⚠️ THE CANONICALS HAVE TO BE REWRITTEN HERE, BECAUSE NEXT DERIVES THEM FROM
 * THE ROUTE RATHER THAN FROM WHAT WE PASS.
 *
 * `buildMetadata` is handed `path: "/"` and the proof that it is honoured is in
 * the same HTML: `og:url` comes out as `https://eliya.trickticmedia.com/`. The
 * canonical next to it comes out as `.../he/`, and on the legal pages as
 * `.../he/privacy/` — Next resolves `alternates.canonical` against the current
 * route segment, and the route is `[locale]` whatever the URLs end up being.
 *
 * Overriding it per page in the app would mean a `generateMetadata` in all four
 * page files whose only job is to undo a prefix, and would silently rot the day
 * a fifth page is added without one. Doing it here keeps "the export is served
 * from the root" in the single place that already owns that idea — and a
 * canonical pointing at a URL that no longer exists is worse than crude.
 *
 * Scoped to this origin so nothing else in the markup can be caught by it.
 */
const { siteUrl } = JSON.parse(
  readFileSync(
    join(process.cwd(), "app", "src", "config", "generated-site.json"),
    "utf8",
  ),
);
const origin = siteUrl.replace(/\/+$/, "");
let rewritten = 0;

const rewriteHtml = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      rewriteHtml(full);
    } else if (entry.name.endsWith(".html")) {
      const before = readFileSync(full, "utf8");
      const after = before.split(`${origin}/he`).join(origin);
      if (after !== before) {
        writeFileSync(full, after);
        rewritten += 1;
      }
    }
  }
};
rewriteHtml(outDir);
console.log(
  `[flatten-locale-export] rewrote locale-prefixed canonicals in ${rewritten} file(s)`,
);

/*
 * ⚠️ /he/ IS KEPT ALIVE AS A REDIRECT, NOT DELETED.
 *
 * The site was live at eliya.trickticmedia.com/he/ before this change, that URL
 * was indexable, and it is the one Daniel has in his browser history. A static
 * host cannot issue a 301, so this is the same meta-refresh the foundation used
 * for the root stub, pointed the other way, plus a canonical so a crawler that
 * already has /he/ is told where the page actually lives now.
 */
mkdirSync(localeDir, { recursive: true });
writeFileSync(
  join(localeDir, "index.html"),
  `<!doctype html>
<html lang="he">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="https://eliya.trickticmedia.com/">
    <meta http-equiv="refresh" content="0; url=/">
    <title>אליה יצחק</title>
  </head>
  <body><p><a href="/">אליה יצחק</a></p></body>
</html>
`,
);

console.log(
  "[flatten-locale-export] hoisted app/out/he/* to app/out/ (Hebrew at the root); /he/ left as a redirect",
);
