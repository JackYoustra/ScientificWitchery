import { defineDocumentType, ComputedFields, makeSource } from 'contentlayer2/source-files'
import { writeFileSync } from 'fs'
import readingTime from 'reading-time'
import { slug } from 'github-slugger'
import { minutes, proseMinutes } from './lib/readingTime'
import path from 'path'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import siteMetadata from './data/siteMetadata'
import { allCoreContent, sortPosts, type MDXBlog } from 'pliny/utils/contentlayer.js'
import { isoDate } from './lib/formatDate'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Formats an OG/Twitter card scraper will actually render. Notably absent:
 * `.svg` and `.avif`, which neither Twitter nor Facebook accept — a post whose
 * only art is an SVG diagram is better off with the site banner than a card
 * that fails to load.
 */
const CARD_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i

/** ```fenced``` blocks, so a path inside a code sample is never mistaken for art. */
const FENCED_CODE = /^[^\S\n]*(```|~~~)[\s\S]*?^[^\S\n]*\1[^\S\n]*$/gm

/**
 * `![alt](/path)`, `![alt](</path>)`, and the JSX forms — both the raw `<img>`
 * and the `<Image>` component, whose attributes are usually spread over several
 * lines. `<source>` is deliberately not matched: those are videos.
 */
const IMAGE_REFERENCE =
  /!\[[^\]]*\]\(\s*<?([^)\s>]+)|<(?:img|image)\b[^>]*?\bsrc=\{?\s*["']([^"']+)["']/gi

/**
 * Best-effort social card image for a post that declares no `images:`.
 *
 * Picks the first *local* body image in a card-friendly format. Remote images
 * are deliberately skipped: hotlinking someone else's CDN into our OG tags
 * breaks the moment they move or hotlink-protect the file.
 */
function deriveSocialImage(body: string): string {
  const prose = body.replace(FENCED_CODE, '')
  for (const match of prose.matchAll(IMAGE_REFERENCE)) {
    const url = (match[1] || match[2] || '').trim()
    if (url.startsWith('/') && CARD_IMAGE_EXTENSIONS.test(url.split(/[?#]/)[0])) {
      return url
    }
  }
  return siteMetadata.socialBanner
}

/** The slice of a raw contentlayer document that `cardImage` reads. */
interface CardImageDocument {
  images?: string | string[] | null
  body: { raw: string }
}

/** Author-declared `images:` wins, then the first body image, then the banner. */
function cardImage(doc: CardImageDocument): string {
  if (doc.images) {
    const declared = typeof doc.images === 'string' ? doc.images : doc.images[0]
    if (declared) return declared
  }
  return deriveSocialImage(doc.body.raw)
}

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(/^.+?(\/)/, ''),
  },
  path: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath,
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  toc: { type: 'string', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
function createTagCount(allBlogs: MDXBlog[]) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = slug(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
  })
  // sort to make canonical ordering, preserve record form
  const sortedTagCount: Record<string, number> = Object.fromEntries(
    Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  )
  writeFileSync('./app/tag-data.json', JSON.stringify(sortedTagCount))
}

function createSearchIndex(allBlogs: MDXBlog[]) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify(allCoreContent(sortPosts(allBlogs)))
    )
    console.log('Local search index generated...')
  }
}

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    // Required: every post has one, and a missing summary silently degrades the
    // listing, the search index, and both meta descriptions.
    summary: { type: 'string', required: true },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    /** Optional multi-part grouping, e.g. `series: 'Road to Petaflop'` + `part: 1`. */
    series: { type: 'string' },
    part: { type: 'number' },
  },
  computedFields: {
    ...computedFields,
    /**
     * Card image for OG/Twitter. Author-declared `images:` wins; otherwise we
     * fall back to the post's first usable body image, then the site banner.
     */
    socialImage: { type: 'string', resolve: cardImage },
    /**
     * Two estimates, because these posts are code-heavy and counting a
     * traceback as prose is misleading — `road-to-petaflop` is 47% fenced
     * code, which doubles its naive estimate.
     *
     * `readingMinutes` is prose only. `readingMinutesWithCode` counts
     * everything. Display shows the second only when it differs enough to
     * matter; see `readingLabel` in lib/readingTime.ts.
     */
    readingMinutes: {
      type: 'number',
      resolve: (doc) => proseMinutes(doc.body.raw),
    },
    readingMinutesWithCode: {
      type: 'number',
      resolve: (doc) => minutes(readingTime(doc.body.raw).words),
    },
    structuredData: {
      type: 'json',
      resolve: (doc) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title,
        // Calendar days, rendered in UTC so they match the frontmatter rather
        // than the build machine's timezone.
        datePublished: isoDate(doc.date),
        dateModified: isoDate(doc.lastmod || doc.date),
        description: doc.summary,
        image: cardImage(doc),
        url: `${siteMetadata.siteUrl}/${doc._raw.flattenedPath}`,
      }),
    },
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    occupation: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: 'data',
  documentTypes: [Blog, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: {
            className: ['content-header'],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData()
    createTagCount(allBlogs)
    createSearchIndex(allBlogs)
  },
})
