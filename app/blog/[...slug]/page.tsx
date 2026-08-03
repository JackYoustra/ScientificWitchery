import '@/css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { MDXRenderer } from '@/components/MDXRenderer'
import {
  allBlogs,
  allAuthors,
  sortPosts,
  coreContent,
  allCoreContent,
  type Authors,
  type Blog,
} from '@/lib/content'
import PostLayout from '@/layouts/PostLayout'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const slug = decodeURI((await params).slug.join('/'))
  const post = allBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  // `socialImage` is computed: declared `images:` if present, else the post's
  // first usable body image, else the site banner. Never empty.
  let imageList = [post.socialImage]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const absolute = (img: string) => (img.includes('http') ? img : siteMetadata.siteUrl + img)
  const ogImages = imageList.map((img) => ({ url: absolute(img) }))

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList.map(absolute),
    },
  }
}

export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = decodeURI((await params).slug.join('/'))
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = allBlogs.find((p) => p.slug === slug) as Blog
  // `series` + `part` have been in the schema and on two pairs of posts since
  // they were written, and nothing has ever rendered them. Ordered by `part`,
  // with a missing part sorting last rather than to the front as `undefined`
  // would under a numeric comparator.
  const series = post.series
    ? sortedCoreContents
        .filter((p) => p.series === post.series)
        .map((p) => ({ path: p.path, title: p.title, part: p.part }))
        .sort((a, b) => (a.part ?? Infinity) - (b.part ?? Infinity))
    : undefined
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  const mainContent = coreContent(post)
  const jsonLd = post.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  return (
    <div className="max-w-full" style={{ overflowWrap: 'anywhere' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostLayout content={mainContent} next={next} prev={prev} series={series}>
        <MDXRenderer code={post.body.code} components={components} toc={post.toc} />
      </PostLayout>
    </div>
  )
}
