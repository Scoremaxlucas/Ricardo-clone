import { SIC_SUPPORT_EMAIL } from '@/lib/sic/config'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Impressum',
  robots: { index: true, follow: true },
}

export default function SicImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Impressum</h1>
      <p className="mt-2 text-sm text-slate-500">
        Angaben gemäss gesetzlicher Informationspflicht für Swiss Immo Cert.
      </p>

      <dl className="mt-8 space-y-6 text-sm">
        <div>
          <dt className="font-semibold text-sic-navy">Betreibergesellschaft</dt>
          <dd className="mt-1 text-slate-700">Score-Max GmbH</dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Adresse</dt>
          <dd className="mt-1 whitespace-pre-line text-slate-700">
            {'In der Hauswiese 2\nCH-Zollikerberg\nSchweiz'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Kontakt</dt>
          <dd className="mt-1 text-slate-700">
            <a href={`mailto:${SIC_SUPPORT_EMAIL}`} className="text-sic-action underline-offset-2 hover:underline">
              {SIC_SUPPORT_EMAIL}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Zuständig für den Inhalt</dt>
          <dd className="mt-1 text-slate-700">Geschäftsleitung der Score-Max GmbH</dd>
        </div>
      </dl>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        Swiss Immo Cert ist ein Angebot der Score-Max GmbH und keine amtliche Stelle. Für die Nutzung gelten die{' '}
        <Link href="/sic/agb" className="underline-offset-2 hover:underline">
          AGB
        </Link>{' '}
        und die{' '}
        <Link href="/sic/datenschutz" className="underline-offset-2 hover:underline">
          Datenschutzerklärung
        </Link>
        .
      </p>
    </div>
  )
}
