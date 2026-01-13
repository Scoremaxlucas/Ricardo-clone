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
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      document.body.style.overflow = 'hidden'
      // Double RAF for smooth animation start
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      document.body.style.overflow = ''
      // Wait for exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!shouldRender) return null

  return (
    <>
      {/* Backdrop - smooth fade with blur */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: isAnimating ? 'blur(2px)' : 'blur(0px)',
          WebkitBackdropFilter: isAnimating ? 'blur(2px)' : 'blur(0px)',
          transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet - smooth slide with spring-like easing */}
      <div
        className={`fixed top-0 z-50 h-full bg-white shadow-2xl ${
          side === 'right' ? 'right-0' : 'left-0'
        }`}
        style={{
          width: '300px',
          maxWidth: '85vw',
          transform: isAnimating
            ? 'translateX(0)'
            : side === 'right'
              ? 'translateX(100%)'
              : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
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
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-90"
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

