# Scientific Witchery

Source for [jackyoustra.com](https://jackyoustra.com) — Jack Youstra's blog, plus a
couple of interactive tools that run entirely in the browser:

- `/binary` — drops a Mach-O/ELF binary in and charts its size breakdown, using
  Twiggy and Bloaty compiled to WebAssembly.
- `/converter` — "Pdx Converter": pastes in a Paradox (Clausewitz) save or script
  file and converts it to JSON, via the `jomini` Rust crate compiled to WASM.
- `/projects/quiz` — a BuzzFeed-style quiz.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Contentlayer2** turns `data/blog/*.mdx` into typed content at build time;
  MDX pipeline includes KaTeX math, Prism syntax highlighting, GFM, and
  autolinked headings.
- **Tailwind CSS** for styling, `next-themes` for dark mode.
- **Rust → WebAssembly** in `rust-wasm/`, built with `wasm-pack` and consumed as
  a local path dependency (`"rust-wasm": "./rust-wasm/pkg"`).
- **ECharts** for the binary-size visualisations; **Umami** and **Vercel
  Analytics** for analytics. There is no comment system — the Giscus config in
  `data/siteMetadata.js` and `.env.example` is kept, unwired, for a later
  restore.

## Running it

Requires [bun](https://bun.sh). Node is only needed for the postbuild scripts,
which bun shells out to.

```bash
bun install
bun run dev      # http://localhost:3000
```

Other scripts:

| command                | what it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `bun run build`        | production build, then `scripts/postbuild.mjs` writes the RSS feeds  |
| `bun run wasm`         | rebuild `rust-wasm/pkg` (only needed after editing `rust-wasm/src/`) |
| `bun run lint`         | eslint with `--fix`                                                  |
| `bun run spell`        | cspell over the posts                                                |
| `bun run cypress:open` | end-to-end tests                                                     |

`bun run spell` is advisory, not a gate: it currently exits non-zero, almost
entirely on compiler flags and tracebacks inside fenced code blocks, which
`cspell.json` does not exclude.

`bun run cypress:open` expects the site already running **on port 3002** —
`cypress.config.ts` and `cypress/e2e/spec.cy.ts` both hardcode it, and no script
in `package.json` binds that port, so start one yourself (`bunx next start -p
3002` after a build).

Copy `.env.example` to `.env.local` and fill in what you need; everything in it
is optional for local development.

## Writing

Posts are MDX files in `data/blog/`. Frontmatter fields are declared in
`velite.config.ts` — `title`, `date` and `summary` are required, the rest
(`tags`, `lastmod`, `draft`, `images`, `authors`, `series`, `part`) are not.
Tags are lowercased and slugified (`github-slugger`) before they become
`/tags/<tag>` routes, so write them lowercase in frontmatter. Site configuration
lives in `data/siteMetadata.js`, nav links in `data/headerNavLinks.ts`, and the
projects page reads `data/projectsData.ts`.

Two per-post values are computed rather than written: `socialImage` (declared
`images:`, else the first card-friendly local body image, else the site banner)
and the `readingMinutes` / `readingMinutesWithCode` pair.

## Deploying

Deploys are manual, from a local machine, via the Vercel CLI. See
[DEPLOY.md](./DEPLOY.md).

## Licence

MIT — see [LICENSE](./LICENSE), which retains the copyright notice of the
starter template this site grew out of alongside Jack's own.
