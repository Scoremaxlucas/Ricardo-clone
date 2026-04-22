import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

function BaseIcon(props: Props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props} />
}

export function IconListing(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
      <path d="M15 6h4M17 4v4" />
    </BaseIcon>
  )
}

export function IconShield(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </BaseIcon>
  )
}

export function IconHandshake(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11h3l3-3 4 4 3-2h3" />
      <path d="M4 11v5a2 2 0 002 2h1l2 2 2-2h6a2 2 0 002-2v-5" />
    </BaseIcon>
  )
}

export function IconProfile(props: Props) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-1a8 8 0 0112.906-6.32" />
      <path d="M16 19l2 2 4-4" />
    </BaseIcon>
  )
}

export function IconDocument(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
      <rect x="9" y="13" width="6" height="5" rx="1" />
      <path d="M12 13v-2a1 1 0 00-2 0v2" />
    </BaseIcon>
  )
}

export function IconRocket(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
      <circle cx="12" cy="19" r="2" />
    </BaseIcon>
  )
}
