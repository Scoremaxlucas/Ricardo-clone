'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type DropdownOption<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  value: T | ''
  options: DropdownOption<T>[]
  onChange: (v: T) => void
  placeholder: string
  id?: string
  buttonRef?: React.Ref<HTMLButtonElement | null>
}

export function CustomDropdown<T extends string>({ value, options, onChange, placeholder, id, buttonRef }: Props<T>) {
  const genId = useId()
  const listId = `${id ?? genId}-list`
  const innerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node
      if (!buttonRef) return
      if (typeof buttonRef === 'function') buttonRef(node)
      else (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    },
    [buttonRef]
  )

  const selectedLabel = value ? options.find(o => o.value === value)?.label : null

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const idx = Math.max(0, options.findIndex(o => o.value === value))
    setActiveIdx(idx >= 0 ? idx : 0)
  }, [open, options, value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (innerRef.current && !innerRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      innerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = options[activeIdx]
      if (opt) {
        onChange(opt.value)
        close()
      }
      innerRef.current?.focus()
    }
  }

  return (
    <div className="relative w-full">
      <button
        ref={setRefs}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        className="flex h-14 min-h-[56px] w-full items-center justify-between rounded-[14px] border-[1.5px] border-[#e8e8e8] bg-white px-5 text-left text-base font-medium text-[#0d2b1f] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 outline-none focus:border-[#18a87c] focus:shadow-[0_0_0_4px_rgba(24,168,124,0.1)]"
      >
        <span className={selectedLabel ? '' : 'font-normal text-[#c0c0c0]'}>{selectedLabel || placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 text-[#8aa89e]" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open ?
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-[280px] w-full overflow-auto rounded-[14px] border border-[#e8e8e8] bg-white py-1 shadow-lg"
        >
          {options.map((opt, i) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`flex min-h-[52px] w-full items-center px-4 text-left text-[15px] font-medium transition ${
                  i === activeIdx ? 'bg-[#f5fdfb]' : ''
                } ${value === opt.value ? 'text-[#107a5a]' : 'text-[#0d2b1f]'}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => {
                  onChange(opt.value)
                  close()
                  innerRef.current?.focus()
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      : null}
    </div>
  )
}
