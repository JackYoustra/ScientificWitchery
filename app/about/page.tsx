import { allAuthors, type Authors } from '@/lib/content'
import { MDXRenderer } from '@/components/MDXRenderer'
import AuthorLayout from '@/layouts/AuthorLayout'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Me' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors

  return (
    <AuthorLayout>
      <MDXRenderer code={author.body.code} />
    </AuthorLayout>
  )
}
