import ListLayoutWithTags from '@/layouts/ListLayoutWithTags'
import { allBlogs, allCoreContent, sortPosts } from '@/lib/content'
import { genPageMetadata } from '@/app/seo'

export const metadata = genPageMetadata({ title: 'Blog' })

export default function BlogPage() {
  const posts = allCoreContent(sortPosts(allBlogs))
  // No slicing. `app/blog/page/[page]/page.tsx` did exist and prerendered eight
  // pages at five posts each; it was removed deliberately, not because it was
  // broken. Thirty-eight posts is one page, and the tag rail beside this list is
  // the filter that pagination was standing in for. Old /blog/page/N URLs
  // redirect to here — see next.config.ts.
  return <ListLayoutWithTags posts={posts} title="All posts" />
}
