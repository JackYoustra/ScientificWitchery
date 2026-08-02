import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl

  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
    }))

  // Every static page the site actually serves. `/about`, `/binary` and
  // `/converter` were in the sitemap before the cleanup and got dropped along
  // with the rest of the template's default list; they are linked from the nav
  // and from `/projects`, so they belong here.
  const staticRoutes = [
    '',
    'blog',
    'projects',
    'projects/quiz',
    'tags',
    'about',
    'binary',
    'converter',
  ]
  const routes = staticRoutes.map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogRoutes]
}
