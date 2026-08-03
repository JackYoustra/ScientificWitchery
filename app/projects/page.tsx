import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from '@/app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <>
      <div className="divide-rule divide-y">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-ink-strong text-3xl font-bold leading-tight sm:text-4xl">Projects</h1>
          <p className="text-ink-muted text-lg leading-7">
            A few things I&apos;ve built and worked on.
          </p>
        </div>
        <div className="container py-12">
          <div className="-m-4 flex flex-wrap">
            {projectsData.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={d.description}
                imgSrc={d.imgSrc}
                href={d.href}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
