import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="text-ink-faint hover:text-accent mr-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors"
    >
      {text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
