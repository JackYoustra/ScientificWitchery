import Link from '@/components/Link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
      <div className="space-x-2 pb-8 pt-6 md:space-y-5">
        <h1 className="text-ink-faint font-mono text-6xl font-bold tabular-nums md:px-6 md:text-8xl">
          404
        </h1>
      </div>
      <div className="max-w-md">
        <p className="mb-4 text-xl font-bold leading-normal md:text-2xl">
          Sorry we couldn&apos;t find this page.
        </p>
        <p className="mb-8">But dont worry, you can find plenty of other things on our homepage.</p>
        <Link
          href="/"
          className="border-rule text-ink-strong hover:border-rule-strong hover:text-accent inline rounded-lg border px-4 py-2 text-sm leading-5 transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}
