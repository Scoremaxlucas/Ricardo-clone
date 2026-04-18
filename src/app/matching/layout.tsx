import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Helvenda Wohnungen',
    template: '%s — Helvenda Wohnungen',
  },
  description:
    'Helvenda Wohnungen: fair mieten und vermieten — strukturierte Objekte, verifizierte Bewerbungen und ein gemeinsames Helvenda-Konto.',
}

export default function MatchingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
