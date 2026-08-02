import GithubSlugger from 'github-slugger'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Heading, Root } from 'mdast'

export interface TocHeading {
  value: string
  url: string
  depth: number
}

/**
 * Replacement for `pliny/mdx-plugins`'s `extractTocHeadings`.
 *
 * pliny's version holds a single module-level `GithubSlugger` that is never
 * reset, so anchors accumulate a counter across every document processed in
 * the same build: the eleventh post with an "Introduction" heading got
 * `#introduction-11` in its table of contents while `rehype-slug` — which
 * *does* use a fresh slugger per file — emitted `id="introduction"` on the
 * heading itself. Four posts shipped dead in-page links because of it
 * (app-thinning, live-text-kvo, swift-macros-proposal, tca-state-sharing).
 *
 * A slugger per document is the whole fix.
 */
export async function extractTocHeadings(markdown: string): Promise<TocHeading[]> {
  const toc: TocHeading[] = []
  const slugger = new GithubSlugger()
  await remark()
    .use(() => (tree: Root) => {
      visit(tree, 'heading', (node: Heading) => {
        const textContent = toString(node)
        toc.push({
          value: textContent,
          url: '#' + slugger.slug(textContent),
          depth: node.depth,
        })
      })
    })
    .process(markdown)
  return toc
}
