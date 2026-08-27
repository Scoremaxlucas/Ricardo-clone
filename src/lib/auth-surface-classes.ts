import { cn } from '@/lib/utils'

/** Auth card outer shell (login / register / password flows). */
export function authCardShellClass(isSic: boolean): string {
  return cn(
    'rounded-2xl bg-white px-6 py-6 md:px-8 md:py-8',
    isSic
      ? 'shadow-[0_24px_64px_-28px_rgba(15,43,94,0.16)] ring-1 ring-[#e7ddc4]'
      : 'shadow-xl ring-1 ring-gray-100'
  )
}

/** Text inputs on auth pages. */
export function authInputClass(isSic: boolean): string {
  return cn(
    'block w-full rounded-lg border px-4 py-3 transition-all focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    isSic
      ? 'border-slate-200 bg-slate-50 text-[#0f2b5e] placeholder:text-slate-400 focus:border-[#0e7c6b] focus:ring-2 focus:ring-[#0e7c6b]/20'
      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
  )
}

export function authLabelClass(isSic: boolean): string {
  return cn('mb-1.5 block text-sm font-medium', isSic ? 'text-[#0f2b5e]' : 'text-gray-700')
}

export function authMutedTextClass(isSic: boolean): string {
  return cn('text-sm', isSic ? 'text-slate-500' : 'text-gray-500')
}

export function authTitleClass(isSic: boolean): string {
  return cn('text-2xl font-bold', isSic ? 'tracking-[-0.02em] text-[#0f2b5e]' : 'text-gray-900')
}

export function authLinkAccentClass(isSic: boolean, weight: 'medium' | 'semibold' = 'semibold'): string {
  return cn(
    'text-sm transition-colors',
    weight === 'medium' ? 'font-medium' : 'font-semibold',
    isSic ? 'text-[#0e7c6b] hover:text-[#0a6357]' : 'text-primary-600 hover:text-primary-700'
  )
}

export function authCheckboxClass(isSic: boolean): string {
  return cn(
    'h-4 w-4 rounded border',
    isSic
      ? 'border-slate-300 text-[#0e7c6b] focus:ring-[#0e7c6b]'
      : 'border-gray-300 text-primary-600 focus:ring-primary-500'
  )
}
