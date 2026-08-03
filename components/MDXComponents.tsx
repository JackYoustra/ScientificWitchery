import PlinyPre from 'pliny/ui/Pre.js'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm.js'
import type { MDXComponents } from 'mdx/types'
import type { HTMLAttributes } from 'react'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import Nvfp4Visualizations from './Nvfp4'

// pliny's Pre declares `children` as required; MDX passes the full set of <pre>
// attributes with everything optional. Adapt rather than cast.
const Pre = ({ children }: HTMLAttributes<HTMLPreElement>) => <PlinyPre>{children}</PlinyPre>

/**
 * Eight posts open with `<TOCInline toc={props.toc} …/>`, which rendered a
 * bulleted list that took the whole first screen and then scrolled out of reach
 * for the rest of the post. Contents are now the layout's job — `post.toc` is
 * computed for every post, and `PostContents` keeps it on screen.
 *
 * The tag stays in the posts because `data/blog` is the owner's; here it maps to
 * nothing so the rail is the only table of contents on the page.
 */
const TOCInline = () => null

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  Nvfp4Visualizations,
}
