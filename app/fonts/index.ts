import localFont from 'next/font/local'

/**
 * Cantarell, self-hosted.
 *
 * Latin woff2 subsets pulled from Google Fonts (v18). Cantarell ships 400 and
 * 700 only — there is no 500 or 600 — in normal and italic. The files and their
 * OFL licence live next to this module; see ./OFL.txt.
 *
 * Served from our own origin so the `font-src 'self'` CSP in next.config.js
 * holds and no request ever leaves for fonts.googleapis.com / fonts.gstatic.com.
 */
export const cantarell = localFont({
  src: [
    {
      path: './cantarell-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './cantarell-latin-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './cantarell-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './cantarell-latin-700-italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-cantarell',
  // Mirrors the stack in tailwind.config.js so the fallback metrics Next
  // computes line up with what actually paints before the woff2 lands.
  fallback: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
})
