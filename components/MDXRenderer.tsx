import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

type MDXContentComponent = (props: Record<string, unknown>) => React.ReactElement

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
/**
 * Compiled components are cached by source. Evaluating `new Function` during
 * render creates a fresh component type every time, which React treats as a
 * different component — it remounts the subtree and discards its state. The
 * post bodies are build-time constants, so one evaluation each is enough.
 */
const compiled = new Map<string, MDXContentComponent>()

export function getMDXComponent(code: string): MDXContentComponent {
  let component = compiled.get(code)
  if (!component) {
    component = new Function(code)(runtime).default as MDXContentComponent
    compiled.set(code, component)
  }
  return component
}

interface MDXRendererProps {
  code: string
  components?: MDXComponents
  [key: string]: unknown
}

export function MDXRenderer({ code, components, ...rest }: MDXRendererProps) {
  // The rule guards against a fresh component type per render remounting the
  // subtree and losing its state. Neither applies: this is a server component
  // rendered once per page, and `getMDXComponent` memoises by source so a
  // given post always yields the identical component reference.
  const MDXContent = getMDXComponent(code)
  return <MDXContent components={components} {...rest} />
}
