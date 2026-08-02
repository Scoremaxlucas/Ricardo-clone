import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Impressum',
  robots: { index: true, follow: true },
}

export default function SicImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">Impressum</h1>
      <p className="mt-2 text-sm text-slate-500">
        Angaben gemäss gesetzlicher Informationspflicht für Swiss Immo Cert.
      </p>

      <dl className="mt-8 space-y-6 text-sm">
        <div>
          <dt className="font-semibold text-[#0f2b5e]">Betreibergesellschaft</dt>
          <dd className="mt-1 text-slate-700">Score-Max GmbH</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0f2b5e]">Adresse</dt>
          <dd className="mt-1 whitespace-pre-line text-slate-700">
            {'In der Hauswiese 2\nCH-Zollikerberg\nSchweiz'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0f2b5e]">Kontakt</dt>
          <dd className="mt-1 text-slate-700">[E-MAIL/KONTAKT EINFÜGEN]</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0f2b5e]">Handelsregister / UID</dt>
          <dd className="mt-1 text-slate-700">[UID FALLS VORHANDEN]</dd>
        </div>
      </dl>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        Swiss Immo Cert ist ein Angebot der Score-Max GmbH. Für die Nutzung gelten die AGB und die
        Datenschutzerklärung.
      </p>
    </div>
  )
}
