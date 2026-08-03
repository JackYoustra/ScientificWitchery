import { defineConfig, defineCollection, s } from 'velite'
import { writeFileSync } from 'fs'
import path from 'path'
import readingTime from 'reading-time'
import { slug as slugify } from 'github-slugger'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import { remarkCodeTitles, remarkImgToJsx } from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'

import siteMetadata from './data/siteMetadata'
import { minutes, proseMinutes } from './lib/readingTime'
import { isoDate } from './lib/formatDate'
import { extractTocHeadings } from './lib/toc'

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

/** Author-declared `images:` wins, then the first body image, then the banner. */
function cardImage(images: unknown, raw: string): string {
  if (images) {
    const declared = typeof images === 'string' ? images : (images as string[])[0]
    if (declared) return declared
  }
  return deriveSocialImage(raw)
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

/**
 * `blog/foo.mdx`, matching contentlayer's `_raw.sourceFilePath`.
 *
 * `s.path()` drops the extension, and `filePath` is the field the blog layout
 * builds its "view on GitHub" link from, so it has to keep the `.mdx`.
 */
const sourceFilePath = (ctx: { meta: { path: string; config: { root: string } } }) =>
  path.relative(ctx.meta.config.root, ctx.meta.path).split(path.sep).join('/')

const blog = defineCollection({
  name: 'Blog',
  pattern: 'blog/**/*.mdx',
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      tags: s.array(s.string()).default([]),
      lastmod: s.isodate().optional(),
      draft: s.boolean().optional(),
      // Required: every post has one, and a missing summary silently degrades
      // the listing, the search index, and both meta descriptions.
      summary: s.string(),
      images: s.any().optional(),
      authors: s.array(s.string()).optional(),
      /** Optional multi-part grouping, e.g. `series: 'Road to Petaflop'` + `part: 1`. */
      series: s.string().optional(),
      part: s.number().optional(),
      code: s.mdx(),
      raw: s.raw(),
      path: s.path(),
    })
    .transform(async (doc, ctx) => {
      const { code, raw, path: flattened, ...fields } = doc
      const filePath = sourceFilePath(ctx)
      return {
        ...fields,
        type: 'Blog' as const,
        readingTime: readingTime(raw),
        slug: flattened.replace(/^.+?(\/)/, ''),
        path: flattened,
        filePath,
        toc: await extractTocHeadings(raw),
        /**
         * Card image for OG/Twitter. Author-declared `images:` wins; otherwise
         * the post's first usable body image, then the site banner.
         */
        socialImage: cardImage(fields.images, raw),
        /**
         * Two estimates, because these posts are code-heavy and counting a
         * traceback as prose is misleading — `road-to-petaflop` is 47% fenced
         * code, which doubles its naive estimate.
         */
        readingMinutes: proseMinutes(raw),
        readingMinutesWithCode: minutes(readingTime(raw).words),
        // Typed loosely on purpose: the blog page adds `author` to this object
        // after resolving the author documents, and Velite (unlike
        // Contentlayer's untyped `json` fields) would otherwise infer a sealed
        // literal type that rejects the extra key.
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: fields.title,
          // Calendar days, rendered in UTC so they match the frontmatter rather
          // than the build machine's timezone.
          datePublished: isoDate(fields.date),
          dateModified: isoDate(fields.lastmod || fields.date),
          description: fields.summary,
          image: cardImage(fields.images, raw),
          url: `${siteMetadata.siteUrl}/${flattened}`,
        } as Record<string, unknown>,
        body: { code, raw },
      }
    }),
})

const authors = defineCollection({
  name: 'Authors',
  pattern: 'authors/**/*.mdx',
  // Identity lives in `data/siteMetadata.js` and is read there by AuthorLayout.
  // Only `name` stays, because everything else was a second copy of facts that
  // then drifted out of sync with the prose.
  schema: s
    .object({
      name: s.string(),
      code: s.mdx(),
      raw: s.raw(),
      path: s.path(),
    })
    .transform(async (doc, ctx) => {
      const { code, raw, path: flattened, ...fields } = doc
      const filePath = sourceFilePath(ctx)
      return {
        ...fields,
        type: 'Authors' as const,
        readingTime: readingTime(raw),
        slug: flattened.replace(/^.+?(\/)/, ''),
        path: flattened,
        filePath,
        toc: await extractTocHeadings(raw),
        body: { code, raw },
      }
    }),
})

type BlogDoc = Awaited<ReturnType<typeof blog.schema.parse>>

/** Count the occurrences of all tags across blog posts and write to json file. */
function createTagCount(allBlogs: BlogDoc[]) {
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = slugify(tag)
        tagCount[formattedTag] = (tagCount[formattedTag] ?? 0) + 1
      })
    }
  })
  // sort to make canonical ordering, preserve record form
  const sortedTagCount: Record<string, number> = Object.fromEntries(
    Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  )
  writeFileSync('./app/tag-data.json', JSON.stringify(sortedTagCount))
}

function createSearchIndex(allBlogs: BlogDoc[]) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    // Same shape as before: sorted newest-first, drafts dropped in production,
    // and `body` stripped so the index stays small.
    const sorted = [...allBlogs].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
    const core = sorted
      .filter((c) => !isProduction || c.draft !== true)
      .map(({ body: _body, ...rest }) => rest)
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify(core)
    )
    console.log('Local search index generated...')
  }
}

export default defineConfig({
  root: 'data',
  strict: true,
  output: {
    data: '.velite',
    // Velite copies "linked files" into `output.assets` and `--clean` wipes it.
    // The site's real images live in `public/static` and are committed, so point
    // this somewhere harmless and turn the copying off below.
    assets: '.velite/assets',
    base: '/static/',
    clean: false,
  },
  collections: { blog, authors },
  mdx: {
    // Image and link URLs in the posts already point at committed files under
    // `public/`. Rewriting them into a hashed asset dir would break every one.
    copyLinkedFiles: false,
    remarkPlugins: [remarkGfm, remarkCodeTitles, remarkMath, remarkImgToJsx, remarkAlert],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          headingProperties: { className: ['content-header'] },
          content: icon,
        },
      ],
      rehypeKatex,
      [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  complete: async ({ blog }) => {
    createTagCount(blog as BlogDoc[])
    createSearchIndex(blog as BlogDoc[])
  },
})
