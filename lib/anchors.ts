/**
 * Anchor ids shared between a listing and the rail that scroll-spies it.
 *
 * Deliberately not exported from the rail components: those carry `'use client'`,
 * and a function exported from a client module cannot be called while rendering
 * on the server — it is only passable as a prop.
 */

export interface YearGroup {
  year: string
  count: number
}

/** Leading letter because an id is also a fragment and a CSS selector. */
export const yearId = (year: string) => `y${year}`
