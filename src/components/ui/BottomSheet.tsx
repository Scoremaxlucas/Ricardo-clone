'use client'

import { X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    },
    [isOpen, onClose]
  )

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown)

      // Focus the sheet
      sheetRef.current?.focus()

      return () => {
        // Restore body scroll
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)

        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        className="animate-in slide-in-from-bottom absolute bottom-0 left-0 right-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 id="sheet-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="safe-area-inset-bottom border-t border-gray-200 px-4 py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}
