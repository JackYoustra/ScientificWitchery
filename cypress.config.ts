import { defineConfig } from 'cypress'
import Sitemapper from 'sitemapper'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async getSitemapUrls(sitemapUrl: string): Promise<string[]> {
          const sitemap = new Sitemapper({
            url: sitemapUrl,
            timeout: 10000,
          })
          try {
            const { sites } = await sitemap.fetch()
            // replace jackyoustra.com with localhost:3002
            // and https with http
            // and remove the /test route from the list entirely
            const filtered = sites.map((site) =>
              site.replace('jackyoustra.com', 'localhost:3002').replace('https://', 'http://')
            )
            return filtered.filter((site) => !site.includes('/test'))
          } catch (error) {
            throw new Error(`Failed to fetch sitemap: ${(error as Error).message}`)
          }
        },
      })
    },
  },
})
