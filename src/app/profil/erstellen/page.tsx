import { redirect } from 'next/navigation'

type Search = { [key: string]: string | string[] | undefined }

function firstNext(sp: Search): string {
  const n = sp.next
  const v = Array.isArray(n) ? n[0] : n
  if (v && v.startsWith('/')) return v
  return '/wohnungen'
}

/** Vermittelt zur bestehenden Matching-Onboarding-Route (Suchprofil). */
export default function ProfilErstellenPage({ searchParams }: { searchParams: Search }) {
  const next = firstNext(searchParams)
  redirect(`/matching/onboarding?callbackUrl=${encodeURIComponent(next)}`)
}
