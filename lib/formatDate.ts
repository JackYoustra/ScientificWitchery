/**
 * Timezone-stable formatting for post dates.
 *
 * A frontmatter `date:` is a *calendar day*, not an instant. Contentlayer still
 * parses it into a `Date` and serialises an ISO instant, so a zero-padded
 * `2025-06-27` becomes `2025-06-27T00:00:00.000Z` — UTC midnight. Formatting
 * that instant with the *machine's* timezone (what `toLocaleDateString` and
 * pliny's `formatDate` do by default) renders the previous day anywhere west of
 * UTC, so the site showed "June 26" for a post dated June 27.
 *
 * Everything here pins `timeZone: 'UTC'`, which makes the rendered day equal the
 * frontmatter day regardless of where the site is built or viewed. That also
 * removes the server/client hydration mismatch the list layouts were papering
 * over with `suppressHydrationWarning`.
 *
 * Use these helpers instead of `pliny/utils/formatDate` or a bare
 * `new Date(...).toLocaleDateString(...)`.
 */

/** `Sunday, June 27, 2025` — the full byline on a post page. */
export const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

/** `June 27, 2025` — the compact form used in post listings. */
export const listDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

/**
 * `Jun 27` — the homepage index, where posts are grouped under a year heading
 * and repeating the year on every row is noise.
 */
export const indexDateTemplate: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
}

/**
 * Render a post date for humans. Drop-in replacement for pliny's `formatDate`,
 * which cannot be made safe by input alone because it hardcodes the local zone.
 */
export function formatDate(
  date: string | Date,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = listDateTemplate
): string {
  return new Date(date).toLocaleDateString(locale, { ...options, timeZone: 'UTC' })
}

/**
 * The calendar day as `YYYY-MM-DD` in UTC — for machine-readable consumers
 * (`<time dateTime>`, schema.org, sitemaps) that should agree with the frontmatter.
 */
export function isoDate(date: string | Date): string {
  return new Date(date).toISOString().slice(0, 10)
}
