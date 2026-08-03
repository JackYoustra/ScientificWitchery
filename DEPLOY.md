# Deploying

The site is deployed **from this machine**, by hand. Git-triggered deploys are
deliberately off (`vercel.json` -> `"git": { "deploymentEnabled": false }`) and
there is no CI. Pushing to `main` does not ship anything.

## The whole thing

```bash
bun install
bun run wasm      # only when rust-wasm/ changed
bun run build
vercel deploy --prebuilt
```

`bun run build` is the fast local check. It runs three things in order:

1. `velite build` — compiles `data/**/*.mdx` into `.velite/` (typed JSON plus
   the compiled MDX), and its `complete` hook writes `public/search.json` and
   `app/tag-data.json`.
2. `next build` — produces `.next`. Velite is **not** a bundler plugin, so
   nothing about the content pipeline constrains which bundler Next uses.
3. `scripts/postbuild.mjs` — regenerates `public/feed.xml` and the per-tag feeds
   under `public/tags/` by reading `.velite/blog.json`.

Because step 1 is a separate process, `.velite/` must exist before `next build`
runs; if you invoke `next build` directly you will get "Cannot find module
'../.velite'" — run `bun run content` first. `bun run dev` already runs
`velite build --watch` alongside `next dev`, so editing a post still
hot-reloads.

The sitemap is *not* a file: `app/sitemap.ts` serves
`/sitemap.xml` as a route, so nothing should ever sit at `public/sitemap.xml` —
a file there would shadow the route and freeze the sitemap at whatever it said
the day it was written. The artifact `vercel deploy --prebuilt` actually uploads
is `.vercel/output`, which only `vercel build` writes, so the full production
sequence is:

```bash
bun run wasm            # only when rust-wasm/ changed
vercel build --prod
vercel deploy --prebuilt --prod
```

Drop `--prod` from both for a preview URL.

## The Rust/WASM half

`package.json` depends on `"rust-wasm": "./rust-wasm/pkg"` — a local path to the
**built** wasm-pack output. That directory is committed to the repo on purpose,
because otherwise a fresh clone cannot even finish `bun install`.

So: **if you touch anything under `rust-wasm/src/`, run `bun run wasm` and commit
the regenerated `rust-wasm/pkg/`.** Nothing else rebuilds it for you.

```bash
bun run wasm      # cd rust-wasm && wasm-pack build --target bundler --out-dir pkg
```

Requirements: [`rustup`](https://rustup.rs) and
[`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/) (0.13+; built and
verified on 0.15.0). The toolchain itself is pinned in
`rust-wasm/rust-toolchain.toml` (rustup installs it, and the
`wasm32-unknown-unknown` target, automatically on first build).

Two things are load-bearing and easy to undo by accident:

- `rust-wasm/Cargo.lock` is committed. The `twiggy-*` dependencies are git deps
  on a floating `branch = "master"` of `github.com/jackyoustra/twiggy`, so
  without the lockfile every build silently re-resolves them.
- `wasm-pack` writes a `pkg/.gitignore` containing `*` on every build. The
  `wasm` script deletes it; if you invoke `wasm-pack` directly, delete it
  yourself or the freshly built package will be invisible to git again.

### Do not reintroduce `-C target-feature=-reference-types`

Under Next 14 the `wasm` script and `rust-wasm/.cargo/config.toml` both forced
`RUSTFLAGS='-C target-feature=-reference-types'`, because the webpack 5 vendored
in Next 14 parsed wasm with the old `@webassemblyjs` decoder and died on a module
using the reference-types proposal (`Module parse failed: Internal failure:
parseVec could not cast the value`). That flag in turn capped `wasm-bindgen` at
`0.2.63`/`0.2.89`, since 0.2.100+ *requires* reference-types and fails to link
without it (`failed to find the __wbindgen_externref_table_dealloc function`).

Both constraints died with Next 14. Turbopack builds this crate's output with no
configuration at all, reference-types included, and executes it during prerender.
The flag is gone from both places and `wasm-bindgen` now floats at current
(`0.2.126`, with `js-sys` `0.3.103` and `wasm-bindgen-test` `0.3.76`). Putting the
flag back would silently pin the crate to a 2024 wasm-bindgen again — and on a
current toolchain it does not merely produce a worse build, it fails outright.

One trap survives the change: **a `RUSTFLAGS` exported in your shell replaces
`.cargo/config.toml`'s `rustflags` wholesale.** A global
`RUSTFLAGS="-C target-cpu=native"` leaks into the wasm cross-compile, where the
CPU name is meaningless. Scope such things to `[target.aarch64-apple-darwin]` in
`~/.cargo/config.toml` instead of exporting them.

Rust tests run in a browser, not on the host: `cd rust-wasm && wasm-pack test
--headless --firefox`.

## Notes

- Turbopack handles the bundled wasm with no `next.config.ts` entry — the
  `asyncWebAssembly` webpack flag this file used to describe is gone, along with
  the `EXPORT=1` static-export switch it warned about. Deploy as a normal Vercel
  serverless build.
- `bun` is the package manager. There is one lockfile, `bun.lock`.
