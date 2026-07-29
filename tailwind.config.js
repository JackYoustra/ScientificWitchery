// @ts-check
const colors = require('tailwindcss/colors')

/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: [
    './node_modules/pliny/**/*.js',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './lib/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      // shameless rosenzweig.io ripoff
      // Cantarell is self-hosted via next/font/local (see app/fonts/index.ts),
      // which exposes it as --font-cantarell on <html>.
      fontFamily: {
        sans: [
          'var(--font-cantarell)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
      },
      // Cantarell was drawn for UI text at small sizes; left at its natural
      // tracking it feels loose once headings get big. Tighten it slightly, and
      // more so the larger the type gets. Sizes/line-heights match the Tailwind
      // defaults — only letterSpacing is new.
      fontSize: {
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.012em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.016em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.022em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.024em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.026em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.028em' }],
      },
      colors: {
        primary: colors.teal,
        gray: colors.neutral,
      },
      typography: (/** @type {{ theme: (key: string) => string }} */ { theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.600')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('colors.indigo.500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.400')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
