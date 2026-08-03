import PlinyPre from 'pliny/ui/Pre.js'
import TOCInline from 'pliny/ui/TOCInline.js'
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

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  Nvfp4Visualizations,
}
