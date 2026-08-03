'use client'

import { useEffect, useState } from 'react'

/**
 * How far down the viewport the "you are here" line sits, as a fraction of the
 * viewport height. A quarter down reads as the place your eye actually is,
 * rather than the very top edge, where a heading is still arriving.
 */
const READING_LINE = 0.25

/**
 * The id of the section currently being read, given every section id in
 * document order.
 *
 * Deliberately a scroll listener rather than an `IntersectionObserver`: the
 * question is "which heading did I last pass", and an observer answers "which
 * headings are on screen" — which is empty whenever a section is longer than
 * the viewport, i.e. most of a long post.
 *
 * `ids` is joined into a string for the dependency list so a caller can pass a
 * fresh array literal every render without re-subscribing.
 */
export function useScrollSpy(ids: readonly string[]): string | undefined {
  const key = ids.join('\n')
  const [active, setActive] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!key) return
    const sections = key.split('\n')
    let frame = 0

    const measure = () => {
      frame = 0
      const line = window.innerHeight * READING_LINE
      let current: string | undefined
      for (const id of sections) {
        const element = document.getElementById(id)
        if (!element) continue
        // Headings are in document order, so the first one still below the
        // line ends the search.
        if (element.getBoundingClientRect().top > line) break
        current = id
      }
      // At the bottom of the page the last section is current even if its
      // heading never reaches the line — otherwise the final entry, which is
      // exactly what a reader who scrolled to the end is looking at, can never
      // be highlighted.
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      setActive(atEnd ? sections[sections.length - 1] : (current ?? sections[0]))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [key])

  return active
}
