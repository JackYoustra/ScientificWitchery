import { blog, authors, type Blog, type Authors } from '../.velite'

export type { Blog, Authors }

export const allBlogs = blog
export const allAuthors = authors

/**
 * The parts of a document that are cheap to ship to the client.
 *
 * `body` holds the compiled MDX (tens of kilobytes a post) and the raw source;
 * nothing that renders a *list* of posts needs either, so the list layouts and
 * the search index take `CoreContent` instead.
 *
 * Replaces `CoreContent` / `coreContent` / `allCoreContent` / `sortPosts` from
 * `pliny/utils/contentlayer`, whose types were declared against
 * `contentlayer2/core`'s `Document`.
 */
export type CoreContent<T> = Omit<T, 'body'>

const isProduction = process.env.NODE_ENV === 'production'

export function coreContent<T extends { body: unknown }>(content: T): CoreContent<T> {
  const { body, ...rest } = content
  return rest
}

/**
 * Drafts are visible in development and dropped from production builds — same
 * rule pliny applied, kept here so the search index and the listings agree.
 */
export function allCoreContent<T extends { body: unknown; draft?: boolean }>(
  contents: T[]
): CoreContent<T>[] {
  const core = contents.map(coreContent)
  return isProduction ? core.filter((c) => c.draft !== true) : core
}

export function dateSortDesc(a: string, b: string) {
  if (a > b) return -1
  if (a < b) return 1
  return 0
}

/** Newest first. Copies the array rather than sorting Velite's export in place. */
export function sortPosts<T extends { date: string }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => dateSortDesc(a.date, b.date))
}
