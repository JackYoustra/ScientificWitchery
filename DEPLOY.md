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

`bun run build` is the fast local check — it produces `.next` and regenerates the
RSS/sitemap in `public/`. The artifact `vercel deploy --prebuilt` actually
uploads is `.vercel/output`, which only `vercel build` writes, so the full
production sequence is:

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

Three things that are load-bearing and easy to undo by accident:

- The `wasm` script sets `RUSTFLAGS='-C target-feature=-reference-types'`, and
  it has to. Rust 1.82+ enables the wasm `reference-types` proposal by default,
  but the webpack 5 vendored inside Next 14 still parses wasm with the old
  `@webassemblyjs` decoder, which cannot read such a module — `next build` dies
  with `Module parse failed: Internal failure: parseVec could not cast the
  value`. The same flag is in `rust-wasm/.cargo/config.toml` for bare `cargo`
  invocations, but an exported `RUSTFLAGS` in your shell overrides that table
  entirely, so the script sets it explicitly. (A global
  `RUSTFLAGS="-C target-cpu=native"` was masking this: on wasm the CPU name is
  unrecognized, which happened to reset the feature set and switch
  `reference-types` back off.)

- `rust-wasm/Cargo.lock` is committed. The `twiggy-*` dependencies are git deps
  on a floating `branch = "master"` of `github.com/jackyoustra/twiggy`, so
  without the lockfile every build silently re-resolves them.
- `wasm-pack` writes a `pkg/.gitignore` containing `*` on every build. The
  `wasm` script deletes it; if you invoke `wasm-pack` directly, delete it
  yourself or the freshly built package will be invisible to git again.

Rust tests run in a browser, not on the host: `cd rust-wasm && wasm-pack test
--headless --firefox`.

## Notes

- The bundled wasm is loaded asynchronously (`next.config.js` sets
  `asyncWebAssembly`), so the pages that use it do **not** survive `EXPORT=1`
  static export. Deploy as a normal Vercel serverless build.
- `bun` is the package manager. There is one lockfile, `bun.lockb`.
- `wasm-bindgen` is held at the `0.2.63` requirement (`0.2.89` in the lockfile)
  for the same webpack reason: 0.2.100+ *requires* `reference-types` (it looks
  for `__wbindgen_externref_table_dealloc`), so it cannot be built in the
  dialect Next 14's bundler can parse. Bumping it means upgrading Next first.
