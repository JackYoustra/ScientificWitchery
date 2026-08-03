'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import type { CoreContent, Blog } from '@/lib/content'
import Link from '@/components/Link'
import PostRow from '@/components/PostRow'
import tagData from '@/app/tag-data.json'

interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
}

/**
 * The tag-filtered listing, used by `/blog` and `/tags/[tag]`.
 *
 * There is no pagination. There was: the previous version rendered Previous/Next
 * links to `/blog/page/N`, backed by a real route that prerendered eight pages.
 * It was removed on purpose — thirty-eight posts is one page, and the tag rail
 * does the narrowing that pagination only pretended to. The old URLs redirect.
 */
export default function ListLayoutWithTags({ posts, title }: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  // Carry the count alongside the tag instead of looking it back up by key:
  // the pair is what gets rendered, and it can't go missing.
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)
  const activeTag = pathname.split('/tags/')[1]

  return (
    <div>
      <div className="pb-8 pt-6 md:pt-10">
        <h1 className="text-ink-strong text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      </div>

      <div className="border-rule border-t pt-6 lg:grid lg:grid-cols-[12rem_1fr] lg:gap-x-12 lg:pt-8">
        <nav
          aria-label="Tags"
          className="sticky top-[var(--sticky-top)] mb-8 hidden max-h-[calc(100vh-var(--sticky-top)-2rem)] self-start overflow-y-auto pb-2 lg:block"
        >
          <Link
            href="/blog"
            aria-current={pathname.startsWith('/blog') ? 'page' : undefined}
            className={`block border-l-2 py-1.5 pl-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] transition-colors ${
              pathname.startsWith('/blog')
                ? 'border-accent text-accent'
                : 'border-rule text-ink-muted hover:text-ink-strong'
            }`}
          >
            All posts
          </Link>
          <ol>
            {sortedTags.map(([tag, count]) => {
              const current = activeTag === slug(tag)
              return (
                <li key={tag}>
                  <Link
                    href={`/tags/${slug(tag)}`}
                    aria-current={current ? 'page' : undefined}
                    aria-label={`View posts tagged ${tag}`}
                    className={`flex items-baseline justify-between gap-3 border-l-2 py-1.5 pl-3 pr-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors ${
                      current
                        ? 'border-accent text-accent'
                        : 'border-rule text-ink-muted hover:text-ink-strong'
                    }`}
                  >
                    <span className="min-w-0 break-words">{tag}</span>
                    <span className="text-ink-faint shrink-0 tabular-nums">{count}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="min-w-0">
          {posts.length === 0 && <p className="text-ink-muted">No posts found.</p>}
          <ul>
            {posts.map((post) => (
              <li key={post.path} className="border-rule border-b py-6 last:border-b-0">
                <PostRow post={post} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
