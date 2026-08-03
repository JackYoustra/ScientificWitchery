import type { CoreContent, Blog } from '@/lib/content'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate, isoDate, indexDateTemplate, listDateTemplate } from '@/lib/formatDate'
import { readingLabel } from '@/lib/readingTime'

interface Props {
  post: CoreContent<Blog>
  /**
   * The homepage groups by year and puts the year in the group heading, so the
   * row only needs `Jun 27`. Everywhere else the row stands alone and carries
   * the full date.
   */
  showYear?: boolean
}

/**
 * One post in a listing. Shared by the homepage archive and the tag/blog
 * listings so a change to how a post is presented happens once.
 *
 * Metadata is mono and letterspaced throughout the site — it is the only other
 * face here, and with Cantarell offering no weight between 400 and 700 it is
 * what separates a label from the thing it labels.
 */
export default function PostRow({ post, showYear = true }: Props) {
  return (
    <article>
      <div className="text-ink-faint flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.18em]">
        <time dateTime={isoDate(post.date)} className="tabular-nums">
          {formatDate(
            post.date,
            siteMetadata.locale,
            showYear ? listDateTemplate : indexDateTemplate
          )}
        </time>
        <span aria-hidden="true" className="text-rule-strong">
          /
        </span>
        <span>{readingLabel(post.readingMinutes, post.readingMinutesWithCode)}</span>
      </div>
      <h3 className="mt-1.5 text-xl font-bold leading-snug tracking-[-0.012em]">
        <Link href={`/${post.path}`} className="text-ink-strong hover:text-accent">
          {post.title}
        </Link>
      </h3>
      <p className="text-ink-muted mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed">
        {post.summary}
      </p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap">
          {post.tags.map((tag) => (
            <Tag key={tag} text={tag} />
          ))}
        </div>
      )}
    </article>
  )
}
