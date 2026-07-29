# Scientific Witchery

Source for [jackyoustra.com](https://jackyoustra.com) — Jack Youstra's blog, plus a
couple of interactive tools that run entirely in the browser:

- `/binary` — drops a Mach-O/ELF binary in and charts its size breakdown, using
  Twiggy and Bloaty compiled to WebAssembly.
- `/converter` — a text/number format converter, also WASM-backed.
- `/projects/quiz` — a BuzzFeed-style quiz.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Contentlayer2** turns `data/blog/*.mdx` into typed content at build time;
  MDX pipeline includes KaTeX math, Prism syntax highlighting, GFM, and
  autolinked headings.
- **Tailwind CSS** for styling, `next-themes` for dark mode.
- **Rust → WebAssembly** in `rust-wasm/`, built with `wasm-pack` and consumed as
  a local path dependency (`"rust-wasm": "./rust-wasm/pkg"`).
- **ECharts** for the binary-size visualisations, **Giscus** for comments,
  **Umami** for analytics.

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
| `bun run build`        | production build + RSS/sitemap/search-index generation               |
| `bun run wasm`         | rebuild `rust-wasm/pkg` (only needed after editing `rust-wasm/src/`) |
| `bun run lint`         | eslint with `--fix`                                                  |
| `bun run spell`        | cspell over the posts                                                |
| `bun run cypress:open` | end-to-end tests                                                     |

Copy `.env.example` to `.env.local` and fill in what you need; everything in it
is optional for local development.

## Writing

Posts are MDX files in `data/blog/`. Frontmatter fields are declared in
`contentlayer.config.ts` — `title` and `date` are required, the rest
(`tags`, `summary`, `images`, `draft`, `lastmod`, `canonicalUrl`) are not. Site
configuration lives in `data/siteMetadata.js`, nav links in
`data/headerNavLinks.ts`, and the projects page reads `data/projectsData.ts`.

## Deploying

Deploys are manual, from a local machine, via the Vercel CLI. See
[DEPLOY.md](./DEPLOY.md).

## Licence

MIT — see [LICENSE](./LICENSE), which retains the copyright notice of the
starter template this site grew out of alongside Jack's own.
