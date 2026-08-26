import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidSicCertificateCode, normalizeSicCertificateCode } from '@/lib/sic/certificate-code'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import { isSicLandlordPdfReady, joinHolderName, verifiedModuleLineItems } from '@/lib/sic/dossier'
import { recordSicVerifyScan } from '@/lib/sic/events'
import { SIC_SCOPE_NOTE, sicCompletenessLabel } from '@/lib/sic/modules'
import { getSicSession } from '@/lib/sic/session-cookie'
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Zertifikat prüfen',
  robots: { index: false, follow: false },
}

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function clientIp(): string {
  const h = headers()
  return (h.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

export default async function SicVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = normalizeSicCertificateCode(raw)
  const ip = clientIp()

  const rl = await checkRateLimit({ identifier: `sic-verify:${ip}`, limit: 60, window: 3600 })
  if (!rl.allowed) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-sic-pending-text" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Zu viele Abfragen</h1>
          <p className="mt-2 text-sm text-slate-500">Bitte versuche es später erneut.</p>
        </div>
      </div>
    )
  }

  const cert =
    isValidSicCertificateCode(code) ?
      await prisma.sicCertificate.findUnique({
        where: { certificateCode: code },
        include: { modules: { select: { moduleKind: true, status: true, verifiedFacts: true } } },
      })
    : null

  const holderName = cert ? joinHolderName(cert.holderFirstName, cert.holderLastName) : null
  const landlordReady =
    !!cert &&
    isSicLandlordPdfReady({
      holderName,
      status: cert.status,
      expiresAt: cert.expiresAt,
      modules: cert.modules,
    })
  const verifiedModules = cert && landlordReady ? verifiedModuleLineItems(cert.modules) : []

  if (cert && landlordReady) {
    const session = getSicSession()
    await recordSicVerifyScan({
      certificateId: cert.id,
      ip,
      byHolder: session?.email === cert.email,
    })
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <ShieldCheck className="h-4 w-4 text-sic-navy" /> {SIC_BRAND_NAME} — Online-Verifikation
      </div>

      {!cert ?
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <XCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Kein Zertifikat gefunden</h1>
          <p className="mt-2 text-sm text-slate-500">
            Der Code <span className="font-mono">{code || '—'}</span> ist unbekannt.
          </p>
        </div>
      : !landlordReady ?
        // Vor der Freigabe werden keine Personendaten ausgewiesen — es gibt
        // schlicht kein Zertifikat, über das etwas auszusagen wäre.
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-sic-pending-text" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Kein gültiges Zertifikat</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Zu diesem Code liegt derzeit kein gültiges Zertifikat vor. Es ist abgelaufen, widerrufen
            oder noch nicht ausgestellt.
          </p>
        </div>
      : <div className="mt-6 rounded-2xl border border-sic-verified/30 bg-white p-6">
          <div className="flex items-center gap-2 rounded-xl bg-sic-verified-bg px-4 py-3 text-sic-verified-text">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Gültiges Zertifikat</span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Code</dt>
              <dd className="font-mono font-semibold text-slate-900">{cert.certificateCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Inhaber</dt>
              <dd className="font-medium text-slate-900">{holderName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ausgestellt</dt>
              <dd className="font-medium text-slate-900">{fmt(cert.certifiedAt ?? cert.issuedAt)}</dd>
            </div>
            {cert.expiresAt ?
              <div className="flex justify-between">
                <dt className="text-slate-500">Gültig bis</dt>
                <dd className="font-medium text-slate-900">{fmt(cert.expiresAt)}</dd>
              </div>
            : null}
            <div className="flex justify-between">
              <dt className="text-slate-500">Umfang</dt>
              <dd className="font-medium text-slate-900">{sicCompletenessLabel(verifiedModules.length)}</dd>
            </div>
          </dl>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Geprüfte Angaben
          </h2>
          <ul className="mt-3 space-y-4">
            {verifiedModules.map(m => (
              <li key={m.title}>
                <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                <ul className="mt-1.5 space-y-1">
                  {m.lines.map(l => (
                    <li key={l} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sic-verified" /> {l}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
            {SIC_SCOPE_NOTE}
          </p>
        </div>
      }
    </div>
  )
}
