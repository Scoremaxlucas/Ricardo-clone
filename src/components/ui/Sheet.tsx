'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right'
}

export function Sheet({ open, onOpenChange, children, side = 'right' }: SheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      document.body.style.overflow = ''
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop - smooth fade like Ricardo */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet - smooth slide animation like Ricardo */}
      <div
        className={`fixed top-0 z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-out ${
          side === 'right' ? 'right-0' : 'left-0'
        } ${
          isAnimating
            ? 'translate-x-0'
            : side === 'right'
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
        style={{ width: '300px', maxWidth: '85vw' }}
      >
        {children}
      </div>
    </>
  )
}

interface SheetContentProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function SheetContent({ children, onClose, className = '' }: SheetContentProps) {
  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header with close button - clean like Ricardo */}
      {onClose && (
        <div className="flex items-center justify-end px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

