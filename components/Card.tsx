import Image from './Image'
import Link from './Link'

interface CardProps {
  title: string
  description: string
  /** Omit to render a text-only card. */
  imgSrc?: string
  /** Omit to render an unlinked card. */
  href?: string
}

const Card = ({ title, description, imgSrc, href }: CardProps) => (
  <div className="md max-w-[544px] p-4 md:w-1/2">
    <div className={`${imgSrc && 'h-full'}  border-rule overflow-hidden rounded-md border`}>
      {imgSrc &&
        (href ? (
          <Link href={href} aria-label={`Link to ${title}`}>
            <Image
              alt={title}
              src={imgSrc}
              className="object-cover object-center md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <Image
            alt={title}
            src={imgSrc}
            className="object-cover object-center md:h-36 lg:h-48"
            width={544}
            height={306}
          />
        ))}
      <div className="p-6">
        <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="text-ink-muted mb-3 text-[0.9375rem] leading-relaxed">{description}</p>
        {href && (
          <Link
            href={href}
            className="text-accent hover:text-accent-strong text-base leading-6"
            aria-label={`Link to ${title}`}
          >
            Learn more &rarr;
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
