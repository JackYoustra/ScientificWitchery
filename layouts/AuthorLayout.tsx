import { ReactNode } from 'react'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'
import siteMetadata from '@/data/siteMetadata'

interface Props {
  children: ReactNode
}

/**
 * Identity comes from `data/siteMetadata.js`, not from the author file's
 * frontmatter. Both used to declare it, and they drifted: the frontmatter still
 * said "iOS Developer / NanoFlick" from 2023 while the prose below it had been
 * updated to Google. One source, one place to edit.
 *
 * `data/authors/default.mdx` now carries only the prose.
 */
export default function AuthorLayout({ children }: Props) {
  const { author, avatar, occupation, company, email, twitter, linkedin, github } = siteMetadata

  return (
    <div className="divide-rule divide-y">
      <div className="space-y-2 pb-8 pt-6 md:space-y-5">
        <h1 className="text-ink-strong text-3xl font-bold leading-tight sm:text-4xl">Me</h1>
      </div>
      <div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:space-y-0">
        <div className="flex flex-col items-center space-x-2 pt-8">
          {avatar && (
            <Image
              src={avatar}
              alt="avatar"
              width={192}
              height={192}
              className="h-48 w-48 rounded-full"
            />
          )}
          <h2 className="pb-2 pt-4 text-2xl font-bold leading-8 tracking-tight">{author}</h2>
          <div className="text-ink-muted">{occupation}</div>
          <div className="text-ink-muted">{company}</div>
          <div className="flex space-x-3 pt-6">
            <SocialIcon kind="mail" href={`mailto:${email}`} />
            <SocialIcon kind="github" href={github} />
            <SocialIcon kind="linkedin" href={linkedin} />
            <SocialIcon kind="twitter" href={twitter} />
          </div>
        </div>
        <div className="prose pb-8 pt-8 xl:col-span-2">{children}</div>
      </div>
    </div>
  )
}
