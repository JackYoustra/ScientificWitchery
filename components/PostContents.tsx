'use client'

import { useEffect, useState } from 'react'
import type { TocHeading } from '@/lib/toc'
import { useScrollSpy } from '@/lib/useScrollSpy'

/** h4 and below are paragraph-level asides in these posts, not sections. */
const MAX_DEPTH = 3

/** Indent per nesting level. Three levels is all `MAX_DEPTH` can produce. */
const INDENT = ['pl-3', 'pl-6', 'pl-9'] as const

/** How far down the page the phone affordance appears, in pixels. */
const REVEAL_AFTER = 320

interface Entry {
  id: string
  label: string
  level: number
}

/**
 * `post.toc` records absolute heading depth, but posts are inconsistent about
 * where they start — some open at `#`, some at `##`. Normalising against the
 * shallowest heading present means the first tier of every post's contents
 * lines up at the left edge of the rail.
 */
function entriesFrom(toc: TocHeading[]): Entry[] {
  const headings = toc.filter((heading) => heading.depth <= MAX_DEPTH)
  if (headings.length === 0) return []
  const top = Math.min(...headings.map((heading) => heading.depth))
  return headings.map((heading) => ({
    id: heading.url.replace(/^#/, ''),
    label: heading.value,
    level: heading.depth - top,
  }))
}

/**
 * A post's sections, in a sticky left rail on wide screens and as a fixed
 * disclosure at the foot of the screen on phones.
 *
 * The phone treatment is a bottom pill rather than a top bar on purpose: it is
 * within thumb reach, it does not take a slice off the top of every screenful
 * of prose, and collapsed it doubles as a position readout, since it names the
 * section you are currently in. It stays out of the way until you are past the
 * post's header, which is where a reader can first want it.
 */
export default function PostContents({ toc }: { toc: TocHeading[] }) {
  const items = entriesFrom(toc)
  const active = useScrollSpy(items.map((item) => item.id))
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (items.length === 0) return null

  const activeIndex = items.findIndex((item) => item.id === active)
  const activeLabel = items[activeIndex]?.label ?? items[0]?.label

  const link = (item: Entry, index: number, onNavigate?: () => void) => (
    <li key={item.id}>
      <a
        href={`#${item.id}`}
        onClick={onNavigate}
        aria-current={item.id === active ? 'location' : undefined}
        className={`block border-l-2 py-1.5 text-[0.8125rem] leading-snug transition-colors ${
          INDENT[item.level] ?? INDENT[0]
        } ${
          // The traversed part of the rule is filled in: the list is also the
          // progress indicator, which is worth having on posts this long.
          index <= activeIndex ? 'border-accent' : 'border-rule'
        } ${item.id === active ? 'text-accent' : 'text-ink-muted hover:text-ink-strong'}`}
      >
        {item.label}
      </a>
    </li>
  )

  return (
    <>
      {/* `self-start` matters: a stretched grid item is as tall as its row, and
          a sticky element with no room inside its containing block never moves. */}
      <nav
        aria-label="Contents"
        className="sticky top-[var(--sticky-top)] hidden max-h-[calc(100vh-var(--sticky-top)-2rem)] self-start overflow-y-auto pb-2 xl:block"
      >
        <p className="text-ink-faint mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em]">
          Contents
        </p>
        <ol>{items.map((item, index) => link(item, index))}</ol>
      </nav>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-200 xl:hidden ${
          revealed ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {open && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="bg-surface/60 fixed inset-0 -z-10"
          />
        )}
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <nav
            id="post-contents"
            aria-label="Contents"
            hidden={!open}
            className="border-rule bg-surface mb-2 max-h-[55vh] overflow-y-auto rounded-xl border px-3 py-2 shadow-xl"
          >
            <ol>{items.map((item, index) => link(item, index, () => setOpen(false)))}</ol>
          </nav>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="post-contents"
            onClick={() => setOpen((wasOpen) => !wasOpen)}
            className="border-rule bg-surface/95 flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left shadow-lg backdrop-blur"
          >
            <span className="text-ink-faint font-mono text-[0.625rem] uppercase tracking-[0.18em]">
              Contents
            </span>
            <span className="text-ink-strong min-w-0 flex-1 truncate text-sm">{activeLabel}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
              className={`text-ink-faint h-4 w-4 shrink-0 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            >
              <path
                fillRule="evenodd"
                d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
