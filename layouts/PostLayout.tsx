import { ReactNode } from 'react'
import type { CoreContent, Blog } from '@/lib/content'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import Image from '@/components/Image'
import PostContents from '@/components/PostContents'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTop from '@/components/ScrollTop'
import { formatDate, isoDate, postDateTemplate } from '../lib/formatDate'
import { readingLabel } from '../lib/readingTime'

const editUrl = (path: string) => `${siteMetadata.siteRepo}/blob/main/data/${path}`
const discussUrl = (path: string) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`

/** One entry in the `series` this post belongs to, already ordered by `part`. */
export interface SeriesEntry {
  path: string
  title: string
  part: number | undefined
}

interface LayoutProps {
  content: CoreContent<Blog>
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  /** Every post sharing this post's `series`, this one included. */
  series?: SeriesEntry[]
  children: ReactNode
}

/** The mono, letterspaced voice used for every piece of metadata on the page. */
const META = 'font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint'

export default function PostLayout({ content, next, prev, series, children }: LayoutProps) {
  const { filePath, path, date, title, tags, summary, toc } = content
  const basePath = path.split('/')[0]
  const reading = readingLabel(content.readingMinutes, content.readingMinutesWithCode)
  // Drafts are dropped from production, so a two-part series with one part
  // still unpublished is a series of one — and saying "1/1" is worse than
  // saying nothing.
  const inSeries = series && series.length > 1
  const position =
    inSeries && content.part ? `${content.series} ${content.part}/${series.length}` : ''

  return (
    <>
      <ScrollTop />
      <article>
        <header className="max-w-3xl pb-8 pt-6 md:pt-10">
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${META}`}>
            <time dateTime={isoDate(date)}>
              {formatDate(date, siteMetadata.locale, postDateTemplate)}
            </time>
            <span aria-hidden="true" className="text-rule-strong">
              /
            </span>
            <span>{reading}</span>
            {position && (
              <>
                <span aria-hidden="true" className="text-rule-strong">
                  /
                </span>
                <span>{position}</span>
              </>
            )}
          </div>
          <div className="mt-3">
            <PageTitle>{title}</PageTitle>
          </div>
          {summary && (
            <p className="text-ink-muted mt-5 max-w-[54ch] text-xl italic leading-relaxed">
              {summary}
            </p>
          )}
          {/* One author, read from siteMetadata rather than per-post frontmatter,
              so there is a single place to update. A byline, not a column: it is
              the same name on all 38 posts. */}
          <div className="mt-6 flex items-center gap-3">
            {siteMetadata.avatar && (
              <Image
                src={siteMetadata.avatar}
                width={32}
                height={32}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <p className="text-ink-muted text-sm">
              <span className="text-ink-strong">{siteMetadata.author}</span>
              {siteMetadata.occupation && (
                <span className="hidden sm:inline">
                  {' — '}
                  {siteMetadata.occupation}
                  {siteMetadata.company && `, ${siteMetadata.company}`}
                </span>
              )}
            </p>
          </div>
        </header>

        {inSeries && series && (
          <nav aria-label="Series" className="bg-sunken mb-8 max-w-[54ch] rounded-lg p-4">
            <p className={META}>Series</p>
            <p className="text-ink-strong mt-1 text-sm">{content.series}</p>
            <ol className="mt-3 space-y-1.5">
              {series.map((entry, index) => {
                const current = entry.path === path
                return (
                  <li key={entry.path} className="flex gap-3 text-sm leading-snug">
                    <span className="text-ink-faint shrink-0 font-mono text-xs leading-5">
                      {entry.part ?? index + 1}
                    </span>
                    {current ? (
                      <span aria-current="page" className="text-ink-strong">
                        {entry.title}
                      </span>
                    ) : (
                      <Link
                        href={`/${entry.path}`}
                        className="text-accent hover:text-accent-strong"
                      >
                        {entry.title}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="border-rule border-t pt-8 xl:grid xl:grid-cols-[12rem_1fr] xl:gap-x-12">
          <PostContents toc={toc} />
          <div className="min-w-0">
            <div className="prose">{children}</div>

            <footer className="border-rule mt-12 space-y-8 border-t pt-8">
              {tags && tags.length > 0 && (
                <div>
                  <h2 className={META}>Tags</h2>
                  <div className="mt-2 flex flex-wrap">
                    {tags.map((tag) => (
                      <Tag key={tag} text={tag} />
                    ))}
                  </div>
                </div>
              )}

              {(next || prev) && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {prev?.path && (
                    <div>
                      <h2 className={META}>Previous</h2>
                      <Link
                        href={`/${prev.path}`}
                        className="text-ink-strong hover:text-accent mt-1 block"
                      >
                        {prev.title}
                      </Link>
                    </div>
                  )}
                  {next?.path && (
                    <div className="sm:col-start-2 sm:text-right">
                      <h2 className={META}>Next</h2>
                      <Link
                        href={`/${next.path}`}
                        className="text-ink-strong hover:text-accent mt-1 block"
                      >
                        {next.title}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <Link href={`/${basePath}`} className="text-accent hover:text-accent-strong">
                  &larr; Back to the blog
                </Link>
                <Link href={discussUrl(path)} rel="nofollow" className="hover:text-ink-strong">
                  Discuss on Twitter
                </Link>
                <Link href={editUrl(filePath)} className="hover:text-ink-strong">
                  View on GitHub
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </>
  )
}
