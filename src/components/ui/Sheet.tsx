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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet */}
      <div
        className={`fixed top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl transition-transform ${
          side === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {children}
      </div>
    </>
  )
}

interface SheetContentProps {
  children: React.ReactNode
  onClose?: () => void
}

export function SheetContent({ children, onClose }: SheetContentProps) {
  return (
    <div className="flex h-full flex-col">
      {onClose && (
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Menü</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
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

