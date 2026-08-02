import readingTime from 'reading-time'

/** Words per minute for running prose. Matches `reading-time`'s own default. */
const WPM = 200

/**
 * Show the with-code figure only when it is meaningfully larger. Below this,
 * the two numbers are close enough that printing both is noise.
 */
export const CODE_DELTA_THRESHOLD = 5

export const minutes = (words: number) => Math.max(1, Math.ceil(words / WPM))

/**
 * Strip fenced code blocks and JSX/HTML tags before counting.
 *
 * Inline code is deliberately kept: `--qformat=nvfp4` in the middle of a
 * sentence is read at prose speed. Fenced blocks are not — they are skimmed
 * or skipped, and on the longest posts here they are nearly half the words.
 */
export function proseWords(raw: string): number {
  const prose = raw
    .replace(/^---[\s\S]*?^---/m, '') // frontmatter, if present
    .replace(/```[\s\S]*?```/g, '') // fenced code
    .replace(/~~~[\s\S]*?~~~/g, '') // tilde-fenced code
    .replace(/<[^>]+>/g, '') // jsx components and html tags
  return readingTime(prose).words
}

export const proseMinutes = (raw: string) => minutes(proseWords(raw))

/**
 * "21 min" normally; "21 min (40 min with code)" when the difference is worth
 * flagging, so a code-heavy post doesn't advertise a misleadingly small number
 * either.
 */
export function readingLabel(prose: number, withCode: number): string {
  return withCode - prose > CODE_DELTA_THRESHOLD
    ? `${prose} min (${withCode} min with code)`
    : `${prose} min`
}
