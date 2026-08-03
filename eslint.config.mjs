import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Deviations: generated or vendored trees that are not ours to lint.
    '.velite/**', // velite output
    '.vercel/**', // vercel CLI build artifacts
    'rust-wasm/pkg/**', // wasm-pack output
    'rust-wasm/target/**', // cargo build cache
    'public/static/emscripten/**', // prebuilt emscripten bloaty
    '.claude/**', // agent harness state: local settings and git worktrees,
    // each of which carries its own built `.next/` that the
    // `.next/**` entry above — rooted at the repo — cannot reach
  ]),
  {
    // A leading underscore marks a binding that exists only to be destructured
    // away — the standard convention, which the preset does not enable.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // MDX bodies are compiled to source strings at build time, so the component
    // can only be produced by evaluating that string. `getMDXComponent`
    // memoises by source, and this renders on the server once per page, so
    // neither failure the rule guards against — a new type per render, or lost
    // state on remount — is reachable here.
    files: ['components/MDXRenderer.tsx'],
    rules: { 'react-hooks/static-components': 'off' },
  },
])

export default eslintConfig
