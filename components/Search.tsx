'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
  useRegisterActions,
  VisualState,
  type Action,
  type ActionImpl,
} from 'kbar'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from '@/lib/formatDate'

/**
 * Search is an overlay, not a page.
 *
 * pliny's `SearchProvider` wires kbar correctly but ships its own markup, which
 * is a second, unrelated set of colours living in a prebuilt bundle where the
 * token layer cannot reach it. This is the same kbar with this site's skin on
 * it, plus two behaviours pliny's does not have: it lists the newest posts when
 * the field is empty, and it marks the part of a title or summary that matched.
 *
 * kbar itself provides ⌘K / ctrl-K to open, arrows and enter to move and choose,
 * and escape to close.
 */

/** The subset of `public/search.json` this needs. Velite writes the whole post record. */
interface SearchDocument {
  title: string
  date: string
  summary: string
  tags?: string[]
  path: string
}

/** Newest posts to offer before anything has been typed. */
const RECENT = 6

/** `ActionImpl` carries only kbar's own fields, so the rest is looked up by id. */
const Documents = createContext<Map<string, SearchDocument>>(new Map())

function searchDocumentsPath(): string | undefined {
  const search = siteMetadata.search
  if (search?.provider !== 'kbar') return undefined
  const path = search.kbarConfig?.searchDocumentsPath
  return typeof path === 'string' && path.length > 0 ? path : undefined
}

export default function SearchProvider({ children }: { children: ReactNode }) {
  const path = searchDocumentsPath()
  // No hooks above this line: with no search provider configured there is no
  // provider to render, and a conditional hook is not an option.
  if (!path) return <>{children}</>

  return (
    <KBarProvider>
      <SearchOverlay documentsPath={path} />
      {children}
    </KBarProvider>
  )
}

function SearchOverlay({ documentsPath }: { documentsPath: string }) {
  const router = useRouter()
  // `undefined` until the index has been asked for and answered; that is also
  // what distinguishes "still loading" from "loaded, and empty".
  const [documents, setDocuments] = useState<SearchDocument[] | undefined>(undefined)
  const requested = useRef(false)
  const { showing } = useKBar((kbar) => ({ showing: kbar.visualState !== VisualState.hidden }))

  // The index is 50-odd kilobytes and most visits never open search, so it is
  // fetched the first time the overlay is summoned rather than on every page
  // load, which is when pliny's provider fetches it.
  useEffect(() => {
    if (!showing || requested.current) return
    requested.current = true
    let cancelled = false
    fetch(documentsPath)
      .then((response) => response.json() as Promise<SearchDocument[]>)
      .then((json) => {
        if (!cancelled) setDocuments(json)
      })
      .catch(() => {
        if (!cancelled) setDocuments([])
      })
    return () => {
      cancelled = true
    }
  }, [documentsPath, showing])

  const byId = useMemo(
    () => new Map((documents ?? []).map((document) => [document.path, document])),
    [documents]
  )

  const actions = useMemo<Action[]>(
    () =>
      (documents ?? []).map((document) => ({
        id: document.path,
        name: document.title,
        // fuse splits `keywords` on commas and weights it the same as the
        // title, which is what makes a summary searchable.
        keywords: [document.summary, ...(document.tags ?? [])].join(','),
        subtitle: document.summary,
        perform: () => router.push(`/${document.path}`),
      })),
    [documents, router]
  )
  useRegisterActions(actions, [actions])

  return (
    <Documents.Provider value={byId}>
      <KBarPortal>
        <KBarPositioner className="bg-surface/70 z-50 backdrop-blur-sm">
          <KBarAnimator className="w-full max-w-2xl">
            <div className="border-rule bg-surface overflow-hidden rounded-xl border shadow-2xl">
              <div className="border-rule flex items-center gap-3 border-b px-4 py-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="text-ink-faint h-4 w-4 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.2-5.2m0 0a7.5 7.5 0 10-10.6-10.6 7.5 7.5 0 0010.6 10.6z"
                  />
                </svg>
                {/* `border-0 ... focus:ring-0` undoes @tailwindcss/forms, which
                    gives every bare input a border and a blue focus ring. The
                    field is already inside a bordered panel it fills. */}
                <KBarSearch
                  defaultPlaceholder="Search"
                  className="text-ink-strong placeholder:text-ink-faint h-7 w-full border-0 bg-transparent p-0 focus:border-0 focus:outline-none focus:ring-0"
                />
                <kbd className="border-rule text-ink-faint hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.625rem] tracking-wide sm:block">
                  ESC
                </kbd>
              </div>
              <SearchResults loading={documents === undefined} />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </Documents.Provider>
  )
}

function SearchResults({ loading }: { loading: boolean }) {
  const { results } = useMatches()
  const { search } = useKBar((kbar) => ({ search: kbar.searchQuery }))
  const query = search.trim()
  const items = query ? results : results.slice(0, RECENT)

  if (loading) {
    return <p className="text-ink-faint px-4 py-8 text-center text-sm">Loading</p>
  }
  if (items.length === 0) {
    return <p className="text-ink-faint px-4 py-8 text-center text-sm">No results</p>
  }

  return (
    <>
      {!query && (
        <p className="text-ink-faint px-4 pb-1 pt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em]">
          Recent
        </p>
      )}
      <KBarResults
        items={items}
        maxHeight={420}
        onRender={({ item, active }) => <Result item={item} active={active} query={query} />}
      />
    </>
  )
}

/**
 * `KBarResults` clones this element to attach react-virtual's `measureRef`, so
 * the ref has to reach a DOM node — otherwise every row is assumed to be the
 * default 50px and anything that wraps to a second line overlaps the row below.
 * React 19 passes `ref` as an ordinary prop, so no `forwardRef` is needed.
 */
function Result({
  item,
  active,
  query,
  ref,
}: {
  item: ActionImpl | string
  active: boolean
  query: string
  ref?: Ref<HTMLDivElement>
}) {
  const documents = useContext(Documents)

  if (typeof item === 'string') {
    return (
      <div
        ref={ref}
        className="text-ink-faint px-4 pb-1 pt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em]"
      >
        {item}
      </div>
    )
  }

  const record = documents.get(item.id)

  return (
    <div
      ref={ref}
      className={`cursor-pointer border-l-2 px-4 py-2.5 ${
        active ? 'border-accent bg-sunken' : 'border-transparent'
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-ink-strong text-sm">{mark(item.name, query)}</span>
        {record && (
          <time
            dateTime={record.date.slice(0, 10)}
            className="text-ink-faint shrink-0 font-mono text-[0.625rem] tabular-nums"
          >
            {formatDate(record.date, siteMetadata.locale)}
          </time>
        )}
      </div>
      {item.subtitle && (
        <p className="text-ink-muted mt-0.5 line-clamp-2 text-xs leading-relaxed">
          {mark(item.subtitle, query)}
        </p>
      )}
    </div>
  )
}

const escapeForRegExp = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Marks every occurrence of a search term. `String.split` on a capturing group
 * interleaves the separators into the result, so odd indices are the matches.
 *
 * kbar matches fuzzily, so a result can legitimately have nothing to mark; that
 * renders as plain text rather than as an error.
 */
function mark(text: string, query: string): ReactNode {
  const terms = query.split(/\s+/).filter(Boolean).map(escapeForRegExp)
  if (terms.length === 0) return text
  const pattern = new RegExp(`(${terms.join('|')})`, 'ig')
  return text.split(pattern).map((chunk, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="text-accent bg-transparent">
        {chunk}
      </mark>
    ) : (
      chunk
    )
  )
}
