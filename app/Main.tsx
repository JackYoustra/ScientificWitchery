import type { CoreContent, Blog } from '@/lib/content'
import PostRow from '@/components/PostRow'
import YearRail from '@/components/YearRail'
import { yearId, type YearGroup } from '@/lib/anchors'
import siteMetadata from '@/data/siteMetadata'
import { isoDate } from '../lib/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm.js'

interface HomeProps {
  posts: CoreContent<Blog>[]
}

/**
 * Posts bucketed by calendar year, newest first, preserving the order they
 * arrive in. `isoDate` rather than `getFullYear()` so a January post does not
 * change year with the reader's timezone — see lib/formatDate.ts.
 */
function byYear(posts: CoreContent<Blog>[]): { group: YearGroup; posts: CoreContent<Blog>[] }[] {
  const years: { group: YearGroup; posts: CoreContent<Blog>[] }[] = []
  for (const post of posts) {
    const year = isoDate(post.date).slice(0, 4)
    const last = years[years.length - 1]
    if (last && last.group.year === year) {
      last.posts.push(post)
      last.group.count += 1
    } else {
      years.push({ group: { year, count: 1 }, posts: [post] })
    }
  }
  return years
}

/**
 * The archive, whole. There is no pagination and no separate archive route:
 * thirty-odd posts is a page, not a database, and the alternative is a reader
 * paging through five at a time to find something they half-remember.
 */
export default function Home({ posts }: HomeProps) {
  const years = byYear(posts)

  return (
    <>
      <div className="pb-10 pt-6 md:pt-10">
        <h1 className="text-ink-strong max-w-[26ch] text-balance text-4xl font-bold leading-[1.1] sm:text-5xl">
          {siteMetadata.description}
        </h1>
      </div>

      <div className="border-rule border-t pt-6 xl:grid xl:grid-cols-[12rem_1fr] xl:gap-x-12 xl:pt-8">
        <YearRail groups={years.map((entry) => entry.group)} />

        <div className="min-w-0">
          {!posts.length && <p className="text-ink-muted">No posts found.</p>}
          {years.map(({ group, posts: yearPosts }) => (
            <section key={group.year} aria-labelledby={yearId(group.year)} className="mb-12">
              <h2
                id={yearId(group.year)}
                className="border-rule text-ink-strong border-b pb-2 font-mono text-sm tabular-nums tracking-[0.18em]"
              >
                {group.year}
              </h2>
              <ul>
                {yearPosts.map((post) => (
                  <li key={post.slug} className="border-rule border-b py-6 last:border-b-0">
                    <PostRow post={post} showYear={false} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {siteMetadata.newsletter?.provider && (
        <div className="border-rule flex items-center justify-center border-t pt-8">
          <NewsletterForm />
        </div>
      )}
    </>
  )
}
