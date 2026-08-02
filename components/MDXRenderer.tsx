import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

/**
 * Runs the MDX that Velite compiled at build time.
 *
 * Velite emits `outputFormat: 'function-body'`, so `code` is a bare function
 * body that destructures `{ Fragment, jsx, jsxs }` off `arguments[0]` and
 * returns `{ default: MDXContent }`. Handing it the automatic JSX runtime is
 * the whole binding.
 *
 * Deliberately **not** a client component. The `components` map is an object of
 * React components; handing that across the server/client boundary fails with
 * "Functions cannot be passed directly to Client Components". Rendering here on
 * the server also keeps the prose in the prerendered HTML, which is what makes
 * the posts readable without JS and indexable — the interactive pieces inside a
 * post (`Nvfp4Visualizations`) carry their own `'use client'`.
 *
 * Replaces `MDXLayoutRenderer` from `pliny/mdx-components`, which assumed
 * Contentlayer's esbuild bundle instead — that one expected `React`,
 * `ReactDOM` and `_jsx_runtime` as named function arguments.
 */
export function getMDXComponent(code: string) {
  return new Function(code)(runtime).default
}

interface MDXRendererProps {
  code: string
  components?: MDXComponents
  [key: string]: unknown
}

export function MDXRenderer({ code, components, ...rest }: MDXRendererProps) {
  const MDXContent = getMDXComponent(code)
  return <MDXContent components={components} {...rest} />
}
