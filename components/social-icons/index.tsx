import {
  Mail,
  Github,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  X,
  Mastodon,
  Threads,
  Instagram,
} from './icons'

const components = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  x: X,
  mastodon: Mastodon,
  threads: Threads,
  instagram: Instagram,
}

// Tailwind scans for complete class strings, so `h-${size}` never survives the
// build. Sizes have to be spelled out to exist in the stylesheet at all.
const sizeClasses = {
  5: 'h-5 w-5',
  6: 'h-6 w-6',
  8: 'h-8 w-8',
} as const

type SocialIconProps = {
  kind: keyof typeof components
  href: string | undefined
  size?: keyof typeof sizeClasses
}

const SocialIcon = ({ kind, href, size = 8 }: SocialIconProps) => {
  if (
    !href ||
    (kind === 'mail' && !/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(href))
  )
    return null

  const SocialSvg = components[kind]

  return (
    <a
      className="text-ink-faint hover:text-ink-muted text-sm transition"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      <span className="sr-only">{kind}</span>
      <SocialSvg className={`text-ink-muted hover:text-accent fill-current ${sizeClasses[size]}`} />
    </a>
  )
}

export default SocialIcon
