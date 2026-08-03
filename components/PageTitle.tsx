import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * `font-bold`, not `font-extrabold`: Cantarell ships 400 and 700 only, so 800
 * resolved to 700 anyway and the class described something the font cannot do.
 * Weight is not a hierarchy axis on this site — size and tracking are, and the
 * tracking comes from the `--text-*--tracking` scale in globals.css rather than
 * a flat `tracking-tight` at every size.
 */
export default function PageTitle({ children }: Props) {
  return (
    <h1 className="text-ink-strong text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
      {children}
    </h1>
  )
}
