/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link'
import { AnchorHTMLAttributes } from 'react'

// Plain anchor props rather than next/link's `LinkProps`: this doubles as the
// MDX `a` override, and MDX hands us `href?: string` rather than a `Url`.
const CustomLink = ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith('/')
  const isAnchorLink = href && href.startsWith('#')

  if (isInternalLink) {
    return <Link className="break-words" href={href} {...rest} />
  }

  if (isAnchorLink) {
    return <a className="break-words" href={href} {...rest} />
  }

  return (
    <a className="break-words" target="_blank" rel="noopener noreferrer" href={href} {...rest} />
  )
}

export default CustomLink
