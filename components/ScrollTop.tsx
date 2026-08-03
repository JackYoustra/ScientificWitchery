'use client'

import { useEffect, useState } from 'react'

const ScrollTop = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.scrollY > 50) setShow(true)
      else setShow(false)
    }

    window.addEventListener('scroll', handleWindowScroll)
    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [])

  const handleScrollTop = () => {
    window.scrollTo({ top: 0 })
  }

  return (
    // Only from `xl`, where the contents rail replaces the fixed contents pill
    // that owns the bottom of the screen on narrower viewports.
    <div
      className={`fixed bottom-8 right-8 hidden flex-col gap-3 ${show ? 'xl:flex' : 'xl:hidden'}`}
    >
      <button
        aria-label="Scroll To Top"
        onClick={handleScrollTop}
        className="bg-raised text-ink-muted hover:text-ink-strong rounded-full p-2 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

export default ScrollTop
