'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right'
}

export function Sheet({ open, onOpenChange, children, side = 'right' }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop - subtler like Ricardo */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet - narrower and cleaner like Ricardo */}
      <div
        className={`fixed top-0 z-50 h-full bg-white shadow-lg transition-transform ${
          side === 'right' ? 'right-0' : 'left-0'
        }`}
        style={{ width: '280px', maxWidth: '85vw' }}
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
      {/* Header with close button - cleaner like Ricardo */}
      {onClose && (
        <div className="flex items-center justify-end p-3">
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

