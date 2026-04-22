import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { sendEmail } from '@/lib/email/sender'
import { prisma } from '@/lib/prisma'
import { qualifyTenant } from '@/lib/rental/qualifyTenant'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const app = await prisma.rentalApplication.findUnique({
    where: { id },
    include: {
      listing: { include: { user: { select: { id: true, email: true, firstName: true, name: true } } } },
      tenantProfile: true,
      applicant: { select: { email: true, firstName: true, name: true } },
    },
  })
  if (!app) return NextResponse.json({ message: 'Bewerbung nicht gefunden' }, { status: 404 })
  if (!app.listing.user.email) return NextResponse.json({ message: 'Vermieter hat keine E-Mail' }, { status: 400 })
  if (!app.tenantProfile) return NextResponse.json({ message: 'Kein Mieterprofil für Dossier' }, { status: 400 })

  const q = qualifyTenant(app.tenantProfile, app.listing)
  const applicantName = [app.tenantProfile.firstName, app.tenantProfile.lastName].filter(Boolean).join(' ') || app.applicant.name || 'Bewerber/in'

  const html = `<h2>HELVENDA WOHNUNGEN — LEAD DOSSIER</h2>
<p>Erstellt: ${formatDate(new Date())} · Ref: ${app.id}</p>
<h3>WOHNUNG</h3>
<p>${app.listing.title}<br/>${app.listing.address}, ${app.listing.zip} ${app.listing.city}<br/>${formatCHF(app.listing.rentPerMonth)}/Monat + NK ${formatCHF(app.listing.utilitiesPerMonth || 0)}/Monat</p>
<h3>BEWERBER</h3>
<p>Name: ${applicantName}<br/>Geburtsdatum: ${formatDate(app.tenantProfile.dateOfBirth)}<br/>Adresse: ${app.tenantProfile.currentAddress}</p>
<h3>BESCHÄFTIGUNG & EINKOMMEN</h3>
<p>Status: ${app.tenantProfile.employmentStatus}<br/>Arbeitgeber: ${app.tenantProfile.employer || '—'}<br/>Berufsbezeichnung: ${app.tenantProfile.jobTitle || '—'}<br/>Monatliches Einkommen: ${app.tenantProfile.monthlyIncomeCategory}</p>
<h3>BETREIBUNGSREGISTER</h3>
<p>Status: ${app.tenantProfile.creditCheckStatus}<br/>Ausgestellt: ${app.tenantProfile.creditCheckUploadedAt ? formatDate(app.tenantProfile.creditCheckUploadedAt) : '—'}<br/>Gültig bis: ${app.tenantProfile.creditCheckExpiresAt ? formatDate(app.tenantProfile.creditCheckExpiresAt) : '—'}</p>
<h3>REFERENZ</h3>
<p>${app.tenantProfile.referenceName || '—'} · ${app.tenantProfile.referenceRelation || '—'} · ${app.tenantProfile.referencePhone || '—'}</p>
<h3>NACHRICHT DES BEWERBERS</h3>
<p>${app.message || '—'}</p>
<h3>QUALIFIKATIONS-CHECK</h3>
<p>${q.qualified ? '✅ Alle Anforderungen erfüllt' : `⚠️ Offen: ${q.reasons.map(i => i.message).join(', ')}`}</p>`

  await sendEmail({
    to: app.listing.user.email,
    subject: `Lead-Dossier: ${app.listing.title}`,
    html,
    text: html.replace(/<[^>]+>/g, ''),
    userId: app.listing.user.id,
    from: 'Helvenda Wohnungen <noreply@helvenda.ch>',
  })

  return NextResponse.json({ success: true })
}
