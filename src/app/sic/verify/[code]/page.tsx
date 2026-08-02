import { normalizeSicCertificateCode, isValidSicCertificateCode } from '@/lib/sic/certificate-code'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import { verifiedModuleLineItems, joinHolderName } from '@/lib/sic/dossier'
import { prisma } from '@/lib/prisma'
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Zertifikat prüfen',
  robots: { index: false, follow: false },
}

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function SicVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = normalizeSicCertificateCode(raw)

  const cert =
    isValidSicCertificateCode(code) ?
      await prisma.sicCertificate.findUnique({
        where: { certificateCode: code },
        include: { modules: { select: { moduleKind: true, status: true } } },
      })
    : null

  const now = new Date()
  const valid = !!cert && cert.status === 'ACTIVE' && cert.expiresAt.getTime() > now.getTime()

  if (cert && valid) {
    prisma.sicCertificate
      .update({ where: { id: cert.id }, data: { verificationCount: { increment: 1 }, lastVerifiedAt: now } })
      .catch(() => {})
  }

  const verifiedModules = cert ? verifiedModuleLineItems(cert.modules) : []

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <ShieldCheck className="h-4 w-4 text-[#0f2b5e]" /> {SIC_BRAND_NAME} — Online-Verifikation
      </div>

      {!cert ?
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <XCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Kein Zertifikat gefunden</h1>
          <p className="mt-2 text-sm text-slate-500">
            Der Code <span className="font-mono">{code || '—'}</span> ist unbekannt.
          </p>
        </div>
      : valid ?
        <div className="mt-6 rounded-2xl border border-[#2f9e44]/30 bg-white p-6">
          <div className="flex items-center gap-2 rounded-xl bg-[#2f9e44]/10 px-4 py-3 text-[#1f7a34]">
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
              <dd className="font-medium text-slate-900">
                {joinHolderName(cert.holderFirstName, cert.holderLastName) || 'Gemäss Nachweisen'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Gültig bis</dt>
              <dd className="font-medium text-slate-900">{fmt(cert.expiresAt)}</dd>
            </div>
          </dl>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Verifizierte Angaben</h2>
          {verifiedModules.length === 0 ?
            <p className="mt-2 text-sm text-slate-500">Basiszertifikat — keine Module verifiziert.</p>
          : <ul className="mt-3 space-y-4">
              {verifiedModules.map(m => (
                <li key={m.title}>
                  <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                  <ul className="mt-1.5 space-y-1">
                    {m.lines.map(l => (
                      <li key={l} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#2f9e44]" /> {l}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          }
        </div>
      : <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Nicht (mehr) gültig</h1>
          <p className="mt-2 text-sm text-slate-500">
            Dieses Zertifikat ist {cert.status === 'REVOKED' ? 'widerrufen' : 'abgelaufen'}.
          </p>
        </div>
      }
    </div>
  )
}
