import { cn } from '@/lib/utils'

/** Auth card outer shell (login / register / password flows). */
export function authCardShellClass(isWohnen: boolean): string {
  return cn(
    'rounded-2xl bg-white px-6 py-6 md:px-8 md:py-8',
    isWohnen
      ? 'shadow-[0_24px_64px_-28px_rgba(13,43,31,0.14)] ring-1 ring-[#cfe8dc]'
      : 'shadow-xl ring-1 ring-gray-100'
  )
}

/** Text inputs on auth pages. */
export function authInputClass(isWohnen: boolean): string {
  return cn(
    'block w-full rounded-lg border px-4 py-3 transition-all focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    isWohnen
      ? 'border-slate-200 bg-slate-50 text-[#0d2b1f] placeholder:text-slate-400 focus:border-[#18a87c] focus:ring-2 focus:ring-[#18a87c]/20'
      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
  )
}

export function authLabelClass(isWohnen: boolean): string {
  return cn('mb-1.5 block text-sm font-medium', isWohnen ? 'text-[#2d4a3d]' : 'text-gray-700')
}

export function authMutedTextClass(isWohnen: boolean): string {
  return cn('text-sm', isWohnen ? 'text-[#5a7a6e]' : 'text-gray-500')
}

export function authTitleClass(isWohnen: boolean): string {
  return cn(
    'text-2xl font-bold',
    isWohnen ? 'font-extrabold tracking-[-0.02em] text-[#0d2b1f]' : 'text-gray-900'
  )
}

export function authLinkAccentClass(isWohnen: boolean, weight: 'medium' | 'semibold' = 'semibold'): string {
  return cn(
    'text-sm transition-colors',
    weight === 'medium' ? 'font-medium' : 'font-semibold',
    isWohnen ? 'text-[#107a5a] hover:text-[#0d5c44]' : 'text-primary-600 hover:text-primary-700'
  )
}

export function authCheckboxClass(isWohnen: boolean): string {
  return cn(
    'h-4 w-4 rounded border',
    isWohnen
      ? 'border-slate-300 text-[#18a87c] focus:ring-[#18a87c]'
      : 'border-gray-300 text-primary-600 focus:ring-primary-500'
  )
}
