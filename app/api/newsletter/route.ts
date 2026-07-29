import { NewsletterAPI, type NewsletterConfig } from 'pliny/newsletter'
import siteMetadata from '@/data/siteMetadata'

const handler = NewsletterAPI({
  // siteMetadata is plain JS typed against pliny's loose config shape, so
  // `newsletter` is optional and `provider` widens to `string`. Narrow here
  // rather than suppressing the check outright; pliny validates the provider at
  // runtime and this route is only reachable when one is configured.
  provider: siteMetadata.newsletter?.provider as NewsletterConfig['provider'],
})

export { handler as GET, handler as POST }
