import { slug } from 'github-slugger'
import { allBlogs, allCoreContent, sortPosts } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import ListLayoutWithTags from '@/layouts/ListLayoutWithTags'
import tagData from '@/app/tag-data.json'
import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const tag = decodeURI((await params).tag)
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const paths = tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }))
  return paths
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const tag = decodeURI((await params).tag)
  // Capitalize first letter and convert space to dash. `charAt` rather than
  // `tag[0]` so an empty tag yields an empty title instead of a crash.
  const dashed = tag.split(' ').join('-')
  const title = dashed.charAt(0).toUpperCase() + dashed.slice(1)
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)))
  )
  return <ListLayoutWithTags posts={filteredPosts} title={title} />
}
