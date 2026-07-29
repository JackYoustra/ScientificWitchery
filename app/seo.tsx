import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'

/**
 * `title` is required and `image` is a convenience shorthand for the OG/Twitter
 * card; everything else is passed straight through to Next's `Metadata`, and is
 * spread last so callers can override the defaults built below.
 */
interface PageSEOProps extends Omit<Metadata, 'title' | 'description'> {
  title: string
  description?: string
  image?: string
}

export function genPageMetadata({ title, description, image, ...rest }: PageSEOProps): Metadata {
  return {
    title,
    description: description || siteMetadata.description,
    openGraph: {
      title: `${title} | ${siteMetadata.title}`,
      description: description || siteMetadata.description,
      url: './',
      siteName: siteMetadata.title,
      images: image ? [image] : [siteMetadata.socialBanner],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      title: `${title} | ${siteMetadata.title}`,
      card: 'summary_large_image',
      images: image ? [image] : [siteMetadata.socialBanner],
    },
    ...rest,
  }
}
