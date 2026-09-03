import { SIC_OPERATOR, SIC_SUPPORT_EMAIL, sicOperatorAddressBlock, sicPaths } from '@/lib/sic/config'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Impressum',
  robots: { index: true, follow: true },
}

export default function SicImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl break-words px-5 py-10 sm:py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Impressum</h1>
      <p className="mt-2 text-sm text-slate-500">
        Angaben gemäss gesetzlicher Informationspflicht für Swiss Immo Cert.
      </p>

      <dl className="mt-8 space-y-6 text-sm">
        <div>
          <dt className="font-semibold text-sic-navy">Betreibergesellschaft</dt>
          <dd className="mt-1 text-slate-700">{SIC_OPERATOR.legalName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Adresse</dt>
          <dd className="mt-1 whitespace-pre-line text-slate-700">{sicOperatorAddressBlock()}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Handelsregister</dt>
          <dd className="mt-1 text-slate-700">
            Eingetragen im Handelsregister des Kantons {SIC_OPERATOR.commercialRegisterCanton}
            <br />
            Handelsregister-Nr.: {SIC_OPERATOR.commercialRegisterNo}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">UID</dt>
          <dd className="mt-1 text-slate-700">{SIC_OPERATOR.uid}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Vertretungsberechtigte Person</dt>
          <dd className="mt-1 text-slate-700">{SIC_OPERATOR.representative}</dd>
        </div>
        <div>
          <dt className="font-semibold text-sic-navy">Kontakt</dt>
          <dd className="mt-1 space-y-1 text-slate-700">
            <p>
              <a href={SIC_OPERATOR.phoneHref} className="text-sic-action underline-offset-2 hover:underline">
                {SIC_OPERATOR.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${SIC_SUPPORT_EMAIL}`} className="text-sic-action underline-offset-2 hover:underline">
                {SIC_SUPPORT_EMAIL}
              </a>
            </p>
          </dd>
        </div>
      </dl>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        Swiss Immo Cert ist ein Angebot der {SIC_OPERATOR.legalName} und keine amtliche Stelle. Für die Nutzung
        gelten die{' '}
        <Link href={sicPaths.agb} className="underline-offset-2 hover:underline">
          AGB
        </Link>{' '}
        und die{' '}
        <Link href={sicPaths.datenschutz} className="underline-offset-2 hover:underline">
          Datenschutzerklärung
        </Link>
        .
      </p>

      {/*
        Kein Header-/Hero-Link: Kunden sollen die Journey nicht sehen.
        Impressum ist der diskrete Einstieg fürs Team; danach «Prüfung» im Header.
      */}
      <p className="mt-8 text-[11px] leading-relaxed text-slate-300">
        <Link href={sicPaths.admin} className="underline-offset-2 hover:text-slate-500 hover:underline">
          Interner Zugang
        </Link>
      </p>
    </div>
  )
}
