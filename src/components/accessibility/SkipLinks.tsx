'use client'

import { useEffect, useState } from 'react'

export function SkipLinks() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip links when Tab is pressed (first keyboard interaction)
      if (e.key === 'Tab' && !isVisible) {
        setIsVisible(true)
      }
    }

    const handleFocus = () => {
      // Show skip links when any element receives focus
      if (!isVisible) {
        setIsVisible(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocus)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocus)
    }
  }, [isVisible])

  // Hide skip links when clicking outside
  useEffect(() => {
    if (!isVisible) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.skip-links-container') && !target.closest('.skip-link')) {
        setIsVisible(false)
      }
    }
    
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [isVisible])

  const handleSkip = (targetId: string) => {
    const element = document.getElementById(targetId)
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsVisible(false)
    }
  }

  return (
    <div className="skip-links-container">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          handleSkip('main-content')
        }}
      >
        Zum Hauptinhalt springen
      </a>
      <a
        href="#navigation"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          handleSkip('navigation')
        }}
      >
        Zur Navigation springen
      </a>
      <a
        href="#search"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          handleSkip('search')
        }}
      >
        Zur Suche springen
      </a>
    </div>
  )
}
