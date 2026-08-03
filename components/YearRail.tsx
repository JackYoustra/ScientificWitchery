'use client'

import { useScrollSpy } from '@/lib/useScrollSpy'
import { yearId, type YearGroup } from '@/lib/anchors'

/**
 * The years of the archive, as a sticky left rail on wide screens and a sticky
 * strip of chips across the top on narrower ones.
 *
 * Years get a horizontal strip rather than the post page's disclosure because
 * there are only a handful of them and each label is four characters: they all
 * fit on one line, so a tap target beats a menu. Both forms are children of the
 * same `xl:grid` container — below `xl` that container is an ordinary block, so
 * the strip has the whole page to stick against.
 */
export default function YearRail({ groups }: { groups: YearGroup[] }) {
  const active = useScrollSpy(groups.map((group) => yearId(group.year)))

  return (
    <>
      <div className="border-rule bg-surface/95 sticky top-0 z-30 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 xl:hidden">
        {groups.map((group) => (
          <a
            key={group.year}
            href={`#${yearId(group.year)}`}
            aria-current={yearId(group.year) === active ? 'location' : undefined}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs tabular-nums transition-colors ${
              yearId(group.year) === active
                ? 'bg-raised text-ink-strong'
                : 'text-ink-faint hover:text-ink-strong'
            }`}
          >
            {group.year}
          </a>
        ))}
      </div>

      <nav
        aria-label="Years"
        className="sticky top-[var(--sticky-top)] hidden self-start pb-2 xl:block"
      >
        <ol>
          {groups.map((group) => {
            const current = yearId(group.year) === active
            return (
              <li key={group.year}>
                <a
                  href={`#${yearId(group.year)}`}
                  aria-current={current ? 'location' : undefined}
                  className={`flex items-baseline justify-between gap-4 border-l-2 py-1.5 pl-3 pr-2 font-mono text-sm tabular-nums transition-colors ${
                    current
                      ? 'border-accent text-accent'
                      : 'border-rule text-ink-muted hover:text-ink-strong'
                  }`}
                >
                  <span>{group.year}</span>
                  <span className="text-ink-faint text-xs">
                    {group.count}
                    <span className="sr-only"> posts</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
