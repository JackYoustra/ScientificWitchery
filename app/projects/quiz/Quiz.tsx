'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type QuizQuestion = {
  question: string
  /** Any CSS colour. Used for the question banner and its answer tiles. */
  backgroundColor: string
  /** Text colour to use on top of `backgroundColor`. Defaults to white. */
  fontColor?: string
  answers: string[]
}

export type QuizResult = {
  title: string
  description: string
  imageSrc?: string
  imageAttribution?: string
}

export type QuizProps = {
  title: string
  description?: string
  byline?: {
    author: string
    authorLink?: string
    authorLinkOpenInNewTab?: boolean
    tagline?: string
    avatarImageSrc?: string
  }
  questions: QuizQuestion[]
  /**
   * There is exactly *one* result, and every answer leads to it. That is the joke:
   * whatever you pick, the Central Committee has already decided. Deliberately not
   * a scored quiz — please don't "fix" it into one.
   */
  result: QuizResult
  /** Canonical URL of the quiz. Used by the Facebook / Twitter share buttons. */
  shareUrl: string
  /** Text placed on the clipboard by the copy button. Defaults to `shareUrl`. */
  copyShareText?: string
  /** Scroll the next question (or the result) into view after answering. */
  autoScroll?: boolean
}

/** Cheap stand-in for the old library's TextFit: bigger type for shorter strings. */
function fitClass(text: string, sizes: [string, string, string]) {
  if (text.length <= 14) return sizes[0]
  if (text.length <= 28) return sizes[1]
  return sizes[2]
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const shareButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-white text-white transition-colors hover:bg-white hover:text-[#e40c78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export default function Quiz({
  title,
  description,
  byline,
  questions,
  result,
  shareUrl,
  copyShareText,
  autoScroll = true,
}: QuizProps) {
  const id = useId().replace(/:/g, '')
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [copied, setCopied] = useState(false)
  // Bumped on every answer so re-answering a question scrolls again.
  const [scrollTo, setScrollTo] = useState<{ target: string; nonce: number } | null>(null)

  const topRef = useRef<HTMLDivElement>(null)
  const complete = answers.every((a) => a !== null)

  const select = useCallback(
    (questionIndex: number, answerIndex: number) => {
      setAnswers((prev) => {
        const next = prev.slice()
        next[questionIndex] = answerIndex
        return next
      })
      const isLast = questionIndex === questions.length - 1
      setScrollTo((prev) => ({
        target: isLast ? `${id}-result` : `${id}-q${questionIndex + 1}`,
        nonce: (prev?.nonce ?? 0) + 1,
      }))
    },
    [id, questions.length]
  )

  // Move focus *and* the viewport to whatever the last answer unlocked. Focusing
  // the heading is what makes this usable from a keyboard / screen reader; the
  // old library only scrolled.
  useEffect(() => {
    if (!autoScroll || !scrollTo) return
    const el = document.getElementById(scrollTo.target)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [autoScroll, scrollTo])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(timer)
  }, [copied])

  const retake = () => {
    setAnswers(questions.map(() => null))
    setCopied(false)
    setScrollTo(null)
    topRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const copyLink = async () => {
    const text = copyShareText ?? shareUrl
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* clipboard blocked (insecure context, denied permission) — nothing to do */
    }
  }

  return (
    <div ref={topRef} className="mx-auto mb-12 w-full max-w-[600px] scroll-mt-24 px-4">
      <h1 className="mb-2 text-[1.625rem] font-bold leading-[1.2] sm:text-[2.5rem] sm:leading-[1.05]">
        {title}
      </h1>
      {description ? <p className="mb-4 text-lg leading-[1.2]">{description}</p> : null}

      {byline ? (
        <div className="mb-6 mt-2 flex items-center">
          {byline.avatarImageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="mr-2 h-10 w-10 rounded-full object-cover sm:h-14 sm:w-14"
              src={byline.avatarImageSrc}
              alt=""
            />
          ) : null}
          <span className="flex flex-col items-start justify-center">
            <p className="text-sm leading-[1.21]">
              by{' '}
              {byline.authorLink ? (
                <a
                  className="text-inherit underline decoration-transparent transition-colors hover:decoration-inherit"
                  href={byline.authorLink}
                  target={byline.authorLinkOpenInNewTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                >
                  <strong>{byline.author}</strong>
                </a>
              ) : (
                <strong>{byline.author}</strong>
              )}
            </p>
            {byline.tagline ? (
              <p className="text-sm leading-[1.21] text-gray-600 dark:text-gray-400">
                {byline.tagline}
              </p>
            ) : null}
          </span>
        </div>
      ) : null}

      <ol className="m-0 list-none p-0">
        {questions.map((question, questionIndex) => {
          const answered = answers[questionIndex] !== null
          const fontColor = question.fontColor ?? '#fff'
          return (
            <li key={question.question} className={questionIndex === 0 ? 'mb-8' : 'mb-8 mt-24'}>
              <h2
                id={`${id}-q${questionIndex}`}
                tabIndex={-1}
                style={{ background: question.backgroundColor, color: fontColor }}
                className={`mb-4 flex min-h-[7.5rem] scroll-mt-24 items-center justify-center rounded-[3px] p-3 text-center font-extrabold leading-[1.1] outline-hidden ${fitClass(
                  question.question,
                  ['text-3xl sm:text-5xl', 'text-2xl sm:text-4xl', 'text-xl sm:text-3xl']
                )}`}
              >
                {question.question}
              </h2>
              <div
                role="group"
                aria-labelledby={`${id}-q${questionIndex}`}
                className="grid grid-cols-2 gap-2 sm:gap-x-6 sm:gap-y-4"
              >
                {question.answers.map((answer, answerIndex) => {
                  const selected = answers[questionIndex] === answerIndex
                  return (
                    <button
                      key={answer}
                      type="button"
                      aria-pressed={selected}
                      disabled={complete}
                      onClick={() => select(questionIndex, answerIndex)}
                      style={{ background: question.backgroundColor, color: fontColor }}
                      className={`group flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[3px] border border-gray-100 p-3 text-center shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 enabled:hover:shadow-md disabled:cursor-default sm:aspect-square ${
                        answered && !selected ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      <span
                        className={`font-black leading-[1.1] transition-transform group-enabled:group-hover:scale-105 ${fitClass(
                          answer,
                          ['text-2xl sm:text-3xl', 'text-lg sm:text-2xl', 'text-base sm:text-xl']
                        )}`}
                      >
                        {answer}
                      </span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>

      {complete ? (
        <section
          id={`${id}-result`}
          tabIndex={-1}
          aria-label="Your result"
          className="mt-8 scroll-mt-24 rounded-[3px] bg-[linear-gradient(180deg,#e40c78_0%,#ee3322_51.44%,#e40c78_100%)] p-4 outline-hidden sm:px-4 sm:py-6"
        >
          <div className="mb-4 sm:mb-6">
            <h2 className="m-0 text-left text-sm font-bold leading-[1.2] text-white sm:text-lg">
              {title}
            </h2>
          </div>
          <div className="flex flex-col justify-between rounded-[3px] bg-white text-gray-900">
            <div className="p-4 pb-0 sm:p-6 sm:pb-0">
              <h3 className="mb-2 mt-0 text-lg font-bold sm:text-[1.375rem] sm:leading-[1.2]">
                {result.title}
              </h3>
              <p className="mb-4 mt-0 text-base leading-[1.2] sm:text-lg">{result.description}</p>
            </div>
            {result.imageSrc ? (
              <div className="relative block sm:mx-6 sm:mb-6 sm:overflow-hidden sm:rounded-[3px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="block w-full object-cover object-[center_40%] sm:max-h-[350px]"
                  src={result.imageSrc}
                  alt={result.title}
                />
                {result.imageAttribution ? (
                  <span className="absolute bottom-0 right-0 bg-white/90 px-2 py-1 text-xs leading-[1.2] text-[#222]">
                    {result.imageAttribution}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={retake}
              className="text-base font-semibold leading-[1.2] text-white underline hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Retake
            </button>
            <ul className="m-0 flex list-none justify-center gap-2 p-0">
              <li className="relative">
                <button type="button" onClick={copyLink} className={shareButtonClass}>
                  <span className="sr-only">Copy link to this quiz</span>
                  <LinkIcon />
                </button>
                <span
                  role="status"
                  aria-live="polite"
                  className={`pointer-events-none absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[3px] bg-[#222] px-2 py-1 text-sm text-white transition-opacity ${
                    copied ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {copied ? 'Link copied!' : ''}
                </span>
              </li>
              <li>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareButtonClass}
                >
                  <span className="sr-only">Share this quiz on Twitter</span>
                  <TwitterIcon />
                </a>
              </li>
              <li>
                <a
                  href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareButtonClass}
                >
                  <span className="sr-only">Share this quiz on Facebook</span>
                  <FacebookIcon />
                </a>
              </li>
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
      />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 320 512" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  )
}
