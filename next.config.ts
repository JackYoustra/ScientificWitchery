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
// `worker-src` is stated rather than inherited on purpose: /binary's Emscripten
// build spawns a pthread worker pool, and a worker blocked by CSP does not fail
// loudly — it hangs that page forever on "loading-workers". 'self' is enough
// because the pool loads bloaty.js from this origin; there is no blob: worker.
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' giscus.app;
  img-src * blob: data:;
  media-src 'self';
  connect-src *;
  font-src 'self';
  worker-src 'self';
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

  // Deviation: /blog/page/1..8 were real prerendered routes until the listing
  // stopped paginating. They were never in the sitemap, but they were reachable
  // and therefore possibly indexed, so send them to the listing rather than 404.
  async redirects() {
    return [{ source: '/blog/page/:page', destination: '/blog', permanent: true }]
  },

  // Deviation: the scaffold sets no headers.
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        // /binary runs Bloaty compiled to Emscripten, which needs
        // SharedArrayBuffer, which the browser only exposes to a
        // cross-origin-isolated document. Without these two headers the Bloaty
        // engine cannot initialise at all and the page silently falls back —
        // which it has been doing everywhere, not just locally.
        //
        // Scoped to this route on purpose: site-wide `require-corp` would block
        // every cross-origin resource that lacks CORP, i.e. the hotlinked post
        // images and the godbolt and gist embeds. This page loads only
        // same-origin assets, so it pays no such cost.
        source: '/binary',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        // The other half of the story, and the part that kept Bloaty dead even
        // after /binary became cross-origin isolated.
        //
        // HTML's "check a global object's embedder policy" step says a
        // dedicated worker fails to load when its *owner* is require-corp but
        // the worker script's own response carries no COEP. Same origin does
        // not exempt it. Emscripten spawns its pthread pool with
        // `new Worker(new URL('bloaty.js', import.meta.url))`, so without this
        // header every pool worker fires a bare `error` event — no message, not
        // even an ErrorEvent — none of them answer the `load` handshake, and
        // the `loading-workers` run dependency never clears. The page then sits
        // on "Loading Files..." forever while the console repeats
        // `dependency: loading-workers` every ten seconds.
        //
        // Echoing require-corp here makes the worker's policy match its
        // owner's. It is inert for every other consumer: COEP on a response is
        // only ever consulted for documents and workers.
        source: '/static/emscripten/:path*',
        headers: [{ key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }],
      },
    ]
  },
}

export default nextConfig
