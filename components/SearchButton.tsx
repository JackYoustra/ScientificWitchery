'use client'

import { useSyncExternalStore } from 'react'
import { useKBar } from 'kbar'
import siteMetadata from '@/data/siteMetadata'

/**
 * Opens the search overlay. The shortcut is printed on the button because the
 * overlay is the only way to search — there is no search page to navigate to —
 * so the key has to be discoverable somewhere.
 */
export default function SearchButton() {
  // No hooks above this line. With no provider configured `SearchProvider`
  // renders no kbar context, and `useKBar` would hand back an empty object.
  if (siteMetadata.search?.provider !== 'kbar') return null
  return <SearchToggle />
}

/** The platform never changes while the page is open, so nothing to subscribe to. */
const noop = () => () => {}
const isApplePlatform = () => /Mac|iPhone|iPad/i.test(navigator.userAgent)

function SearchToggle() {
  const { query } = useKBar()
  // `useSyncExternalStore` is the sanctioned way to render a value the server
  // cannot know: it renders the server snapshot, then re-renders with the
  // client's. Reading `navigator` during render instead would be a hydration
  // mismatch, and correcting it from an effect is a cascading render.
  const apple = useSyncExternalStore(noop, isApplePlatform, () => true)
  const modifier = apple ? '⌘' : 'Ctrl '

  return (
    <button
      type="button"
      aria-label="Search"
      onClick={query.toggle}
      className="border-rule text-ink-muted hover:border-rule-strong hover:text-ink-strong flex items-center gap-2 rounded-full border px-2 py-1 transition-colors sm:px-3"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.2-5.2m0 0a7.5 7.5 0 10-10.6-10.6 7.5 7.5 0 0010.6 10.6z"
        />
      </svg>
      <span className="text-ink-faint hidden font-mono text-[0.6875rem] tracking-wide sm:block">
        {modifier}K
      </span>
    </button>
  )
}
