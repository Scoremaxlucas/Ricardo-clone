'use client'

type Props = {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
  label: string
}

export function Toggle({ checked, onChange, id, label }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f0f0] py-4">
      <label htmlFor={id} className="min-h-[44px] flex-1 cursor-pointer text-[15px] font-medium text-[#0d2b1f]">
        {label}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-[26px] w-11 shrink-0 rounded-[13px] transition-colors duration-200 ease-out"
        style={{ backgroundColor: checked ? '#18a87c' : '#e0e0e0' }}
      >
        <span
          className={`absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-[left] duration-200 ease-out ${
            checked ? 'left-[20px]' : 'left-[2px]'
          }`}
        />
      </button>
    </div>
  )
}
