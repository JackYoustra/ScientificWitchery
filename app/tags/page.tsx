import Link from '@/components/Link'
import Tag from '@/components/Tag'
import { slug } from 'github-slugger'
import tagData from '@/app/tag-data.json'
import { genPageMetadata } from '@/app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  // Carry the count alongside the tag instead of looking it back up by key:
  // the pair is what gets rendered, and it can't go missing.
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)
  return (
    <>
      <div className="flex flex-col items-start justify-start md:mt-16 md:flex-row md:items-baseline md:space-x-8">
        <div className="space-x-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-ink-strong text-3xl font-bold leading-tight sm:text-4xl">Tags</h1>
        </div>
        <div className="flex max-w-lg flex-wrap">
          {sortedTags.length === 0 && 'No tags found.'}
          {sortedTags.map(([t, count]) => {
            return (
              <div key={t} className="mb-2 mr-5 mt-2">
                <Tag text={t} />
                <Link
                  href={`/tags/${slug(t)}`}
                  className="text-ink-faint -ml-2 font-mono text-[0.6875rem] tabular-nums"
                  aria-label={`View posts tagged ${t}`}
                >
                  {` (${count})`}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
