import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import { escape } from 'pliny/utils/htmlEscaper.js'
import siteMetadata from '../data/siteMetadata.js'
// import tagData from '../app/tag-data.json' assert { type: 'json' }
// Add this line to read the JSON file
const tagData = JSON.parse(readFileSync(new URL('../app/tag-data.json', import.meta.url), 'utf8'))

const allBlogs = JSON.parse(readFileSync(new URL('../.velite/blog.json', import.meta.url), 'utf8'))

const sortPosts = (posts) =>
  [...posts].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

const generateRssItem = (config, post) => `
  <item>
    <guid>${config.siteUrl}/blog/${post.slug}</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/blog/${post.slug}</link>
    ${post.summary && `<description>${escape(post.summary)}</description>`}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags && post.tags.map((t) => `<category>${t}</category>`).join('')}
  </item>
`

const generateRss = (config, posts, page = 'feed.xml') => `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/blog</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => generateRssItem(config, post)).join('')}
    </channel>
  </rss>
`

async function generateRSS(config, allBlogs, page = 'feed.xml') {
  const publishPosts = allBlogs.filter((post) => post.draft !== true)
  // RSS for blog post
  if (publishPosts.length > 0) {
    const rss = generateRss(config, sortPosts(publishPosts))
    writeFileSync(`./public/${page}`, rss)
  }

  if (publishPosts.length > 0) {
    const tags = Object.keys(tagData)
    // Prune feeds for tags that no longer exist. Nothing else cleans this up, so
    // without it `public/tags/` accumulates directories forever and keeps
    // serving RSS for tags the site dropped years ago.
    const tagsRoot = path.join('public', 'tags')
    if (existsSync(tagsRoot)) {
      const live = new Set(tags)
      for (const entry of readdirSync(tagsRoot, { withFileTypes: true })) {
        if (entry.isDirectory() && !live.has(entry.name)) {
          rmSync(path.join(tagsRoot, entry.name), { recursive: true, force: true })
        }
      }
    }
    for (const tag of tags) {
      const filteredPosts = allBlogs.filter((post) => post.tags.map((t) => slug(t)).includes(tag))
      const rss = generateRss(config, filteredPosts, `tags/${tag}/${page}`)
      const rssPath = path.join('public', 'tags', tag)
      mkdirSync(rssPath, { recursive: true })
      writeFileSync(path.join(rssPath, page), rss)
    }
  }
}

const rss = () => {
  generateRSS(siteMetadata, allBlogs)
  console.log('RSS feed generated...')
}
export default rss
