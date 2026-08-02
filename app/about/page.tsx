import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/layouts/AuthorLayout'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Me' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors

  return (
    <AuthorLayout>
      <MDXLayoutRenderer code={author.body.code} />
    </AuthorLayout>
  )
}
