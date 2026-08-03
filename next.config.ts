import type { NextConfig } from 'next'

/**
 * Everything below the scaffold's defaults is a deliberate deviation. The rule:
 * if a line here isn't in what `create-next-app` generates, it needs a comment
 * saying why. That rule stopped being true for two years, which is how a dead
 * webpack loader, a GitHub Pages export switch and three unused CSP hosts
 * survived in here.
 */

// Deviation: the scaffold ships no CSP. Every host below is in active use —
// gcc.godbolt.org and gist.github.com are embedded in posts, umami and
// va.vercel-scripts are the analytics configured in `data/siteMetadata.js`, and
// giscus is kept only because the comment config is kept for a later restore.
// Dropped from the old list: claude.ai and *.s3.amazonaws.com (zero references),
// and img.buzzfeed.com (an <img>, so img-src already covers it).
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' giscus.app;
  img-src * blob: data:;
  media-src 'self';
  connect-src *;
  font-src 'self';
  frame-src giscus.app gcc.godbolt.org gist.github.com;
`

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy.replace(/\n/g, '') },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Deviation: `data/projectsData.ts` uses a quiz card image hosted on
  // Twitter's CDN, which next/image will not load without an allowlist entry.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'pbs.twimg.com' }],
  },

  // Deviation: the scaffold sets no headers.
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
