<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working in this repo

Personal blog at [jackyoustra.com](https://jackyoustra.com) — 38 MDX posts plus
two Rust/WebAssembly tools that run entirely in the browser. Next 16 App Router,
React 19, Tailwind 4, Turbopack, React Compiler. Package manager is **bun**;
there is no npm or yarn here.

## The one rule that matters most

**If a config line isn't in what `create-next-app` generates, it needs a comment
saying why it exists.**

This project was rebuilt from a fresh scaffold precisely because that rule had
lapsed. Two years of undocumented deviation accumulated a dead webpack loader, a
GitHub Pages export switch for a workflow that no longer existed, three CSP hosts
nothing referenced, and 55 committed files of output from a build tool that had
been removed. None of it looked obviously wrong; it was just unexplained, so
nobody ever deleted it.

`next.config.ts` currently has four deviations, each commented: the CSP and
security headers, cross-origin isolation scoped to `/binary`, the
`pbs.twimg.com` image pattern, and React Compiler.

## Things that will bite you

**Run `bun run content` before `bunx tsc --noEmit`.** Content is compiled by
Velite into `.velite/`, a separate process from the Next build. On a clean
checkout that directory does not exist and `tsc` emits dozens of phantom errors
that all trace back to one missing module.

**Nothing may sit in `public/` that collides with a generated route.** A file in
`public/` is served *instead of* a route with the same path. A committed
`public/sitemap.xml` shadowed `app/sitemap.ts` for two years, so crawlers were
served a January 2024 document advertising deleted routes and omitting every post
written since.

**The two WASM pages are the canary and a green build says nothing about
them.** `app/binary` and `app/converter` run Rust and Emscripten in the browser.
Exercise them against `bunx next start`: drop a real `.wasm` at `/binary`, press
Submit on the prebuilt sample at `/converter`. The Twiggy path was dead for an
unknown length of time because a guard ran one line early and `parser.tsx`'s
engine-fallback chain quietly covered for it; the Bloaty path had never once run
in any browser, for the same reason. That chain now names every engine it tried
and why each failed, in the console and on the page, so check the console —
a chart on screen no longer means both engines are healthy.

**`/binary` needs cross-origin isolation, and so does the worker script
itself.** Bloaty is an Emscripten pthread build, so it needs SharedArrayBuffer,
so `/binary` carries COOP/COEP. The non-obvious half: Emscripten spawns its pool
with `new Worker(new URL('bloaty.js', import.meta.url))`, and a dedicated worker
whose owner is `require-corp` fails to load unless *its own* response carries a
COEP header too — same origin is not an exemption. Both header rules live in
`next.config.ts`. Drop either and the page hangs on "Loading Files..." while the
console repeats `dependency: loading-workers`.

**Dates render in UTC on purpose.** `lib/formatDate.ts` pins `timeZone: 'UTC'`
everywhere a post date becomes text. Velite resolves `date:` to an instant, so
rendering it in the machine's zone shifts most posts back a day. Do not
reintroduce `toLocaleDateString` without a timezone, and do not use pliny's
`formatDate`, which hardcodes the local zone.

**Reading time counts prose, not code.** `lib/readingTime.ts` strips fenced
blocks and JSX before counting — `road-to-petaflop` is 47% fenced code, so the
naive figure doubles it. Inline code still counts, because that reads at prose
speed. Display shows the with-code figure only when the gap exceeds five minutes.

## Where things live

| | |
|---|---|
| Posts | `data/blog/*.mdx` — `title`, `date`, `summary` required |
| Site config | `data/siteMetadata.js` |
| Content schema | `velite.config.ts` |
| Generated content | `.velite/` (gitignored) |
| Nav | `data/headerNavLinks.ts` |
| Projects page | `data/projectsData.ts` |
| Deploy | `DEPLOY.md` — manual, local, via the Vercel CLI |

**Identity lives in `data/siteMetadata.js` and nowhere else.** Author name,
occupation, company, avatar and socials are read from there by both
`AuthorLayout` and `PostLayout`; `data/authors/default.mdx` carries only prose.
Both used to declare it and they drifted: the page displayed a job title two
years out of date directly above a bio that contradicted it.

## Writing copy

**Don't.** Titles, summaries, the tagline and post prose belong to the owner.
Structural labels ("Contents", "Series", "Latest") are fine. Anything that reads
as his voice is not — he has pushed back on invented copy more than once, and was
right to.

If a fact needs correcting rather than a sentence needing writing, describe the
inconsistency and let him resolve it.

## Content conventions

- Tags are lowercase-kebab in frontmatter, slugified by `github-slugger` for
  URLs. Watch for slug collisions: `c++` slugs to `c`, which silently filed the
  C++ post under C until it was renamed `cpp`.
- `series` + `part` group multi-part posts.
- `socialImage` is computed — declared `images:`, else the first card-friendly
  local body image, else the site banner. Remote and `.svg`/`.avif` sources are
  skipped deliberately, since neither Twitter nor Facebook renders them.
- Dead external links are repointed at a successor or a Wayback snapshot taken
  near the post's own date, and marked inline so a reader knows where they land.

## Rust and WebAssembly

`rust-wasm/` builds with `bun run wasm`. The toolchain is pinned in
`rust-toolchain.toml` and `Cargo.lock` is committed — the crate depends on a
twiggy fork tracking a floating branch, so without the lockfile every build
re-resolves. `rust-wasm/pkg/` is committed too, because it is declared as a
dependency and a fresh clone cannot install without it.
