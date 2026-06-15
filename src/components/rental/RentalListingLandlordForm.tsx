'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import type { ExternalLandlordOption } from '@/lib/external-landlords/admin-options'
import type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'
import { rentalImportSourcePolicyMessage } from '@/lib/rental/ingest-source-policy'
import { allowedMonitoringHostLabels, rentalListingHasAutoMonitoring, rentalMonitoringUrlPolicyMessage, rentalReferenceUrlPolicyMessage } from '@/lib/rental/listing-monitoring-url-policy'
import { rentalListingHasMonitoringHttpUrl } from '@/lib/rental/rental-listing-expiry-on'
import type { RentalListingStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { wohnenToast } from '@/lib/wohnen-toast'
import toast from 'react-hot-toast'

export type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'

const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'] as const

function roomsToSelect(r: number): string {
  if (r >= 5) return '5+'
  const s = String(r)
  return (ROOM_OPTIONS as readonly string[]).includes(s) ? s : '3'
}

type AcquisitionKind = 'self' | 'imported' | 'partner'

type Props = {
  mode: 'create' | 'edit'
  listingId?: string
  initial?: RentalListingLandlordInitial
  backHref?: string
  /** `admin`: erweiterte Quelle/Kontakt, optionale Foto-Mindestanzahl */
  variant?: 'landlord' | 'admin'
  /** Standard 3 für Vermieter, 0 für Admin-Neuanlage */
  minPhotos?: number
  afterSaveRedirect?: string
  /** z. B. `/api/admin/rental-listings` oder PATCH `/api/admin/rental-listings/:id` */
  submitApiPath?: string
  /** Admin: Quelle/Herkunft nur bei Neuanlage (manuell) */
  adminShowAcquisitionFields?: boolean
  /** Admin: URL-Import — Quelle fix, nur Erlaubnis-Checkbox + interner Kontakt */
  importMetaLocked?: { importedFrom: string } | null
  /** Admin: optionaler CRM-Override für externen Vermieter. */
  adminExternalLandlordOptions?: ExternalLandlordOption[]
}

export function RentalListingLandlordForm({
  mode,
  listingId,
  initial,
  backHref = '/matching/properties',
  variant = 'landlord',
  minPhotos: minPhotosProp,
  afterSaveRedirect,
  submitApiPath,
  adminShowAcquisitionFields = false,
  importMetaLocked = null,
  adminExternalLandlordOptions = [],
}: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const isAdminForm = variant === 'admin'
  const minPhotos = minPhotosProp ?? (isAdminForm ? 0 : 3)
  const minDescriptionLen = 50

  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [canton, setCanton] = useState('')
  const [rooms, setRooms] = useState<string>('3')
  const [areaSqm, setAreaSqm] = useState('')
  const [floor, setFloor] = useState('')
  const [rentPerMonth, setRentPerMonth] = useState('')
  const [utilitiesPerMonth, setUtilitiesPerMonth] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [listingStatus, setListingStatus] = useState<RentalListingStatus>('active')
  const [listingExpiresOn, setListingExpiresOn] = useState('')
  const createDefaultExpirySeeded = useRef(false)
  const [landlordNotifyEmail, setLandlordNotifyEmail] = useState('')
  const notifyEmailSeeded = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [acquisition, setAcquisition] = useState<AcquisitionKind>('self')
  const [originalUrl, setOriginalUrl] = useState('')
  const [importPermissionAck, setImportPermissionAck] = useState(false)
  const [partnerChoice, setPartnerChoice] = useState<'tutti' | 'facebook' | 'other'>('tutti')
  const [partnerOther, setPartnerOther] = useState('')
  const [landlordNameInternal, setLandlordNameInternal] = useState('')
  const [landlordContactInternal, setLandlordContactInternal] = useState('')
  const [landlordNoteInternal, setLandlordNoteInternal] = useState('')
  const [selectedExternalLandlordId, setSelectedExternalLandlordId] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [monitoringUrl, setMonitoringUrl] = useState('')

  useEffect(() => {
    if (!initial) return
    setTitle(initial.title)
    setAddress(initial.address)
    setZip(initial.zip)
    setCity(initial.city)
    setCanton(initial.canton)
    setRooms(roomsToSelect(initial.rooms))
    setAreaSqm(String(initial.areaSqm))
    setFloor(initial.floor != null ? String(initial.floor) : '')
    setRentPerMonth(String(initial.rentPerMonth))
    setUtilitiesPerMonth(initial.utilitiesPerMonth != null ? String(initial.utilitiesPerMonth) : '')
    setDepositAmount(initial.depositAmount != null ? String(initial.depositAmount) : '')
    setAvailableFrom(initial.availableFrom.slice(0, 10))
    setDescription(initial.description)
    setImageUrls(initial.photos)
    if (mode === 'edit') {
      setListingStatus(initial.status)
    }
    setListingExpiresOn(initial.listingExpiresOn ?? '')
    setLandlordNotifyEmail(initial.landlordNotifyEmail ?? '')
    setSelectedExternalLandlordId(initial.externalLandlordId ?? '')
    setLandlordNameInternal(initial.landlordInternalName ?? '')
    setLandlordContactInternal(initial.landlordInternalContact ?? '')
    setLandlordNoteInternal(initial.landlordInternalNote ?? '')
    setReferenceUrl(initial.referenceUrl ?? '')
    setMonitoringUrl(initial.monitoringUrl ?? '')
  }, [initial, mode])

  useEffect(() => {
    if (mode !== 'create' || initial != null || variant !== 'landlord' || notifyEmailSeeded.current) return
    const em = (session?.user as { email?: string | null })?.email?.trim()
    if (em) {
      notifyEmailSeeded.current = true
      setLandlordNotifyEmail(prev => (prev.trim() ? prev : em))
    }
  }, [mode, initial, variant, session?.user])

  useEffect(() => {
    if (mode !== 'create' || initial != null || createDefaultExpirySeeded.current) return
    createDefaultExpirySeeded.current = true
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 90)
    setListingExpiresOn(d.toISOString().slice(0, 10))
  }, [mode, initial])

  const hasMonitoringHttpUrl = useMemo(() => {
    if (monitoringUrl.trim()) {
      return rentalListingHasAutoMonitoring({ monitoringUrl: monitoringUrl.trim() })
    }
    if (importMetaLocked?.importedFrom) {
      return rentalListingHasMonitoringHttpUrl({ importedFrom: importMetaLocked.importedFrom })
    }
    if (initial?.monitoringUrl || initial?.importedFrom) {
      return rentalListingHasMonitoringHttpUrl({
        monitoringUrl: initial.monitoringUrl,
        importedFrom: initial.importedFrom,
      })
    }
    if (isAdminForm && adminShowAcquisitionFields && acquisition === 'imported') {
      return rentalListingHasMonitoringHttpUrl({ importedFrom: originalUrl.trim() })
    }
    return false
  }, [
    monitoringUrl,
    importMetaLocked,
    initial?.monitoringUrl,
    initial?.importedFrom,
    isAdminForm,
    adminShowAcquisitionFields,
    acquisition,
    originalUrl,
  ])

  const minExpireYmd = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const maxExpireYmd = useMemo(() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 730)
    return d.toISOString().slice(0, 10)
  }, [])

  const roomsValue = useMemo(() => (rooms === '5+' ? 5 : parseFloat(rooms)), [rooms])

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !userId) return
    setUploading(true)
    try {
      const next = [...imageUrls]
      for (let i = 0; i < files.length; i++) {
        if (next.length >= 10) {
          toast.error('Maximal 10 Fotos')
          break
        }
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          toast.error('Nur Bilder erlaubt')
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'rental-listing')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data as { message?: string }).message || 'Upload fehlgeschlagen')
          continue
        }
        if ((data as { url?: string }).url) next.push((data as { url: string }).url)
      }
      setImageUrls(next)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const landlordContactPlainValue = (): string | null => {
    const name = landlordNameInternal.trim()
    const contact = landlordContactInternal.trim()
    const note = landlordNoteInternal.trim()
    if (!name && !contact && !note) return null
    const parts: string[] = []
    if (name) parts.push(`Name: ${name}`)
    if (contact) parts.push(`Kontakt: ${contact}`)
    if (note) parts.push(`Notiz: ${note}`)
    return parts.join('\n')
  }

  const buildAdminMeta = ():
    | { importSource?: 'SELF' | 'IMPORTED' | 'PARTNER'; importedFrom?: string | null; landlordContactPlain: string | null }
    | null => {
    if (!isAdminForm) return null
    const landlordContactPlain = landlordContactPlainValue()

    if (importMetaLocked) {
      return {
        importSource: 'IMPORTED',
        importedFrom: importMetaLocked.importedFrom.trim(),
        landlordContactPlain,
      }
    }

    if (mode === 'edit' && !adminShowAcquisitionFields) {
      return { landlordContactPlain }
    }

    let importSource: 'SELF' | 'IMPORTED' | 'PARTNER' = 'SELF'
    let importedFrom: string | null = null
    if (adminShowAcquisitionFields) {
      if (acquisition === 'imported') {
        importSource = 'IMPORTED'
        importedFrom = originalUrl.trim() || null
      } else if (acquisition === 'partner') {
        importSource = 'PARTNER'
        if (partnerChoice === 'tutti') importedFrom = 'Tutti.ch'
        else if (partnerChoice === 'facebook') importedFrom = 'Facebook Marketplace'
        else importedFrom = partnerOther.trim() ? `Andere: ${partnerOther.trim()}` : 'Andere'
      }
    }
    return { importSource, importedFrom, landlordContactPlain }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrls.length < minPhotos) {
      toast.error(minPhotos === 0 ? 'Maximal 10 Fotos; Fotos optional' : 'Mindestens 3 Fotos erforderlich')
      return
    }
    if (description.trim().length < minDescriptionLen) {
      toast.error(`Beschreibung mindestens ${minDescriptionLen} Zeichen`)
      return
    }

    if (importMetaLocked && !importPermissionAck) {
      toast.error('Bitte bestätigen: ausdrückliche Erlaubnis des Vermieters zur Veröffentlichung auf Helvenda.')
      return
    }

    if (!hasMonitoringHttpUrl && !listingExpiresOn.trim()) {
      toast.error('Bitte «Gültig bis» setzen oder eine Monitoring-URL (Tutti/UrbanHome/…) angeben.')
      return
    }

    if (isAdminForm) {
      const refErr = referenceUrl.trim() ? rentalReferenceUrlPolicyMessage(referenceUrl.trim()) : null
      if (refErr) {
        toast.error(refErr)
        return
      }
      const monErr = monitoringUrl.trim() ? rentalMonitoringUrlPolicyMessage(monitoringUrl.trim()) : null
      if (monErr) {
        toast.error(monErr)
        return
      }
    }

    const notifyTrim = landlordNotifyEmail.trim()
    if (notifyTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyTrim)) {
      toast.error('Ungültige E-Mail für Bewerbungs-Benachrichtigungen.')
      return
    }

    if (isAdminForm && adminShowAcquisitionFields) {
      if (acquisition === 'imported') {
        if (!originalUrl.trim()) {
          toast.error('Bitte die Original-URL angeben.')
          return
        }
        const sourcePolicyError = rentalImportSourcePolicyMessage(originalUrl.trim())
        if (sourcePolicyError) {
          toast.error(sourcePolicyError)
          return
        }
        if (!importPermissionAck) {
          toast.error('Bitte die Erlaubnis zur Veröffentlichung bestätigen.')
          return
        }
      }
      if (acquisition === 'partner' && partnerChoice === 'other' && !partnerOther.trim()) {
        toast.error('Bitte die Partnerplattform unter «Andere» beschreiben.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title,
        address,
        zip,
        city,
        canton,
        rooms: roomsValue,
        areaSqm: parseInt(areaSqm, 10),
        floor: floor.trim() === '' ? null : floor,
        rentPerMonth: parseInt(rentPerMonth, 10),
        utilitiesPerMonth: utilitiesPerMonth.trim() === '' ? null : utilitiesPerMonth,
        depositAmount: depositAmount.trim() === '' ? null : depositAmount,
        availableFrom,
        description,
        requiresCreditCheck: true,
        photos: imageUrls,
        ...(hasMonitoringHttpUrl ?
          listingExpiresOn.trim() ?
            { listingExpiresOn: listingExpiresOn.trim() }
          : {}
        : { listingExpiresOn: listingExpiresOn.trim() }),
        ...(variant === 'landlord' || isAdminForm ?
          { landlordNotifyEmail: notifyTrim || null }
        : {}),
        ...(isAdminForm ? { externalLandlordId: selectedExternalLandlordId || null } : {}),
        ...(isAdminForm ?
          {
            referenceUrl: referenceUrl.trim() || null,
            monitoringUrl: monitoringUrl.trim() || null,
          }
        : {}),
        ...(mode === 'edit' ? { status: listingStatus } : {}),
      }

      const adminMeta = buildAdminMeta()
      if (adminMeta) {
        if (adminMeta.importSource) payload.importSource = adminMeta.importSource
        if ('importedFrom' in adminMeta) payload.importedFrom = adminMeta.importedFrom
        if (adminMeta.landlordContactPlain != null) payload.landlordContactPlain = adminMeta.landlordContactPlain
      }

      let url: string
      let method: 'POST' | 'PATCH'
      if (submitApiPath) {
        url = mode === 'edit' && listingId ? `${submitApiPath}/${listingId}` : submitApiPath
        method = mode === 'edit' ? 'PATCH' : 'POST'
      } else {
        url = mode === 'edit' && listingId ? `/api/rental-listings/${listingId}` : '/api/rental-listings'
        method = mode === 'edit' ? 'PATCH' : 'POST'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      wohnenToast.listingSaved()
      const dest =
        afterSaveRedirect ||
        (mode === 'edit' ? (isAdminForm ? '/admin/listings' : '/matching/properties') : '/matching/properties')
      router.push(dest.startsWith('/') ? dest : '/matching/properties')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const photoHint = minPhotos === 0 ? '0–10 Bilder (optional für Admin)' : '3–10 Bilder'
  const canSubmit =
    !submitting &&
    imageUrls.length >= minPhotos &&
    imageUrls.length <= 10 &&
    description.trim().length >= minDescriptionLen &&
    (hasMonitoringHttpUrl || listingExpiresOn.trim().length > 0)

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <Link href={backHref} className="text-sm font-medium text-teal-800 hover:underline">
          ← Zurück
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Miet-Inserat</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">
        {mode === 'edit' ? 'Inserat bearbeiten' : 'Neues Inserat erstellen'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {isAdminForm ?
          'Admin-Erfassung: Pflichtfelder wie üblich. Fotos optional (0–10). Beschreibung mindestens 50 Zeichen. Interne Vermieter-Kontaktdaten werden nicht öffentlich angezeigt.'
        : 'Pflichtfelder ausfüllen. Fotos über den Helvenda-Upload (3–10 Bilder). Beschreibung mindestens 50 Zeichen.'}
      </p>

      {mode === 'edit' ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Status</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:flex-wrap">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'active'}
                onChange={() => setListingStatus('active')}
              />
              <span className="font-medium text-emerald-900">Aktiv</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'rented'}
                onChange={() => setListingStatus('rented')}
              />
              <span className="font-medium text-slate-800">Vermietet</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'archived'}
                onChange={() => setListingStatus('archived')}
              />
              <span className="font-medium text-slate-700">Archiviert</span>
            </label>
          </div>
          {listingStatus === 'archived' ? (
            <p className="mt-3 text-xs text-amber-900">Archivierte Inserate sind nicht mehr öffentlich sichtbar.</p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {!isAdminForm ?
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
            <label className="mb-1 block text-sm font-medium text-slate-800">E-Mail für Bewerbungs-Benachrichtigungen</label>
            <input
              type="email"
              autoComplete="email"
              value={landlordNotifyEmail}
              onChange={e => setLandlordNotifyEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="z. B. buero@example.ch"
            />
            <p className="mt-2 text-xs text-slate-600">
              An diese Adresse senden wir eine E-Mail, sobald sich ein qualifizierter Mieter bewirbt. Wenn leer, verwenden
              wir die E-Mail Ihres Helvenda-Kontos.
            </p>
          </div>
        : null}
        {isAdminForm && importMetaLocked ?
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-bold text-amber-950">Quelle (Import)</p>
            <p className="break-all text-xs text-slate-800">{importMetaLocked.importedFrom}</p>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-900">
              <input
                type="checkbox"
                checked={importPermissionAck}
                onChange={e => setImportPermissionAck(e.target.checked)}
                className="mt-1"
              />
              <span>
                Ich habe die ausdrückliche Erlaubnis des Vermieters zur Veröffentlichung auf Helvenda erhalten. *
              </span>
            </label>
          </div>
        : null}
        {isAdminForm && adminShowAcquisitionFields ?
          <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="text-sm font-bold text-rose-900">Quelle des Inserats</p>
            <div className="space-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="acq"
                  checked={acquisition === 'self'}
                  onChange={() => setAcquisition('self')}
                />
                Eigenes Inserat (Admin erfasst)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="acq"
                  checked={acquisition === 'imported'}
                  onChange={() => setAcquisition('imported')}
                />
                Importiert mit Erlaubnis
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="acq"
                  checked={acquisition === 'partner'}
                  onChange={() => setAcquisition('partner')}
                />
                Partnerplattform
              </label>
            </div>
            {acquisition === 'imported' ?
              <div className="space-y-3 border-t border-rose-200 pt-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800">Original-URL *</label>
                  <input
                    type="url"
                    value={originalUrl}
                    onChange={e => setOriginalUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="https://…"
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={importPermissionAck}
                    onChange={e => setImportPermissionAck(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Der Vermieter hat ausdrücklich die Erlaubnis zur Veröffentlichung auf Helvenda erteilt. *
                  </span>
                </label>
              </div>
            : null}
            {acquisition === 'partner' ?
              <div className="border-t border-rose-200 pt-3">
                <label className="mb-1 block text-sm font-medium text-slate-800">Plattform *</label>
                <select
                  aria-label="Partnerplattform"
                  value={partnerChoice}
                  onChange={e => setPartnerChoice(e.target.value as 'tutti' | 'facebook' | 'other')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="tutti">Tutti.ch</option>
                  <option value="facebook">Facebook Marketplace</option>
                  <option value="other">Andere</option>
                </select>
                {partnerChoice === 'other' ?
                  <input
                    type="text"
                    value={partnerOther}
                    onChange={e => setPartnerOther(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Name der Plattform"
                  />
                : null}
              </div>
            : null}
          </div>
        : null}

        {isAdminForm ?
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Vermieter-Kontakt (intern)</p>
            <p className="text-xs text-slate-600">Nur für Admins sichtbar, nicht öffentlich.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">CRM-Zuordnung (optional)</label>
              <select
                aria-label="Externer Vermieter im CRM"
                value={selectedExternalLandlordId}
                onChange={e => setSelectedExternalLandlordId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Automatisch zuordnen / neu anlegen</option>
                {adminExternalLandlordOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.secondary ? `${option.label} · ${option.secondary}` : option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-600">
                Leer lassen: Helvenda matcht nach E-Mail / Telefon und erstellt bei Bedarf automatisch einen neuen
                Vermieter-Datensatz.
              </p>
              {selectedExternalLandlordId ?
                <p className="mt-2">
                  <Link
                    href={`/admin/landlords/${selectedExternalLandlordId}`}
                    className="text-xs font-semibold text-teal-800 hover:underline"
                  >
                    CRM-Eintrag öffnen
                  </Link>
                </p>
              : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name des Vermieters</label>
              <input
                aria-label="Name des Vermieters"
                value={landlordNameInternal}
                onChange={e => setLandlordNameInternal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefon oder E-Mail</label>
              <input
                aria-label="Telefon oder E-Mail des Vermieters"
                value={landlordContactInternal}
                onChange={e => setLandlordContactInternal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Interne Notiz</label>
              <textarea
                aria-label="Interne Notiz zum Vermieter"
                value={landlordNoteInternal}
                onChange={e => setLandlordNoteInternal(e.target.value)}
                rows={3}
                placeholder="z. B. Erlaubnis per WhatsApp am 25.05 erhalten"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-Mail für Bewerbungs-Leads (optional)</label>
              <input
                type="email"
                autoComplete="email"
                value={landlordNotifyEmail}
                onChange={e => setLandlordNotifyEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Explizite Zieladresse, unabhängig vom Kontaktfeld"
              />
              <p className="mt-1 text-xs text-slate-600">
                Wenn leer: erste gültige E-Mail im Feld «Telefon oder E-Mail» (nach Entschlüsselung), sonst Konto-E-Mail
                des Inserats-Inhabers.
              </p>
            </div>
          </div>
        : null}

        {isAdminForm ?
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">URLs (intern)</p>
            <p className="text-xs text-slate-600">
              Referenz für dich (z. B. Homegate): nur sichtbar im Admin, keine automatische Prüfung. Monitoring-URL
              löst die tägliche Frische-Prüfung aus ({allowedMonitoringHostLabels()}).
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Referenz-URL (optional)</label>
              <input
                type="url"
                aria-label="Referenz-URL"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                placeholder="https://www.homegate.ch/rent/…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Zum manuellen Prüfen, ob das Original-Inserat noch live ist. Texte und Fotos nicht von dort übernehmen.
              </p>
              {referenceUrl.trim() ?
                <p className="mt-2">
                  <a
                    href={referenceUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-teal-800 hover:underline"
                  >
                    Referenz im Browser öffnen
                  </a>
                </p>
              : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monitoring-URL (optional)</label>
              <input
                type="url"
                aria-label="Monitoring-URL"
                value={monitoringUrl}
                onChange={e => setMonitoringUrl(e.target.value)}
                placeholder="https://www.tutti.ch/…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Mit gültiger Monitoring-URL ist «Gültig bis» optional — Helvenda prüft automatisch, ob das Inserat noch
                erreichbar ist.
              </p>
            </div>
          </div>
        : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Titel *</label>
          <input
            aria-label="Titel"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Adresse (Strasse, Nr.) *</label>
          <input
            aria-label="Adresse"
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">PLZ *</label>
            <input
              aria-label="PLZ"
              required
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ort *</label>
            <input
              aria-label="Ort"
              required
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kanton *</label>
          <select
            aria-label="Kanton"
            required
            value={canton}
            onChange={e => setCanton(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Bitte wählen</option>
            {SWISS_CANTONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Anzahl Zimmer *</label>
            <select
              aria-label="Anzahl Zimmer"
              required
              value={rooms}
              onChange={e => setRooms(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {ROOM_OPTIONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Wohnfläche m² *</label>
            <input
              aria-label="Wohnfläche in Quadratmetern"
              required
              type="number"
              min={1}
              step={1}
              value={areaSqm}
              onChange={e => setAreaSqm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Etage (optional)</label>
          <input
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            placeholder="z. B. 3"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Monatsmiete CHF *</label>
            <input
              aria-label="Monatsmiete in CHF"
              required
              type="number"
              min={0}
              step={1}
              value={rentPerMonth}
              onChange={e => setRentPerMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nebenkosten CHF (optional)</label>
            <input
              aria-label="Nebenkosten in CHF"
              type="number"
              min={0}
              step={1}
              value={utilitiesPerMonth}
              onChange={e => setUtilitiesPerMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kaution CHF (optional)</label>
          <input
            aria-label="Kaution in CHF"
            type="number"
            min={0}
            step={1}
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Verfügbar ab *</label>
          <input
            aria-label="Verfügbar ab"
            required
            type="date"
            value={availableFrom}
            onChange={e => setAvailableFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Gültig bis (Kalendertag, Schweiz){hasMonitoringHttpUrl ? ' (optional)' : ' *'}
          </label>
          <input
            aria-label="Gültig bis"
            required={!hasMonitoringHttpUrl}
            type="date"
            min={minExpireYmd}
            max={maxExpireYmd}
            value={listingExpiresOn}
            onChange={e => setListingExpiresOn(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">
            {hasMonitoringHttpUrl ?
              'Mit Monitoring-URL ist kein Enddatum nötig — Helvenda prüft die Quelle automatisch.'
            : 'Ohne Monitoring-URL ist ein Enddatum Pflicht. Referenz-URLs (z. B. Homegate) zählen nicht für die Automatik.'}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Fotos * ({photoHint})
          </label>
          <input
            aria-label="Fotos hochladen"
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || !userId}
            onChange={e => {
              if (!userId) {
                toast.error('Bitte anmelden')
                return
              }
              void uploadFiles(e.target.files)
            }}
            className="w-full text-sm"
          />
          {uploading && <p className="mt-1 text-xs text-slate-500">Lade hoch…</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {imageUrls.map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-start justify-end bg-black/60 pb-1 pl-1 text-sm font-bold leading-none text-white"
                  aria-label="Foto entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {imageUrls.length} / {photoHint} · Beschreibung ({description.trim().length} Zeichen)
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Beschreibung * (min. 50 Zeichen)</label>
          <textarea
            aria-label="Beschreibung"
            required
            minLength={50}
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3 text-sm leading-relaxed text-slate-700">
          <span className="font-semibold text-slate-900">Qualifizierte Bewerbungen: </span>
          Interessenten benötigen ein vollständiges Mieterprofil, einen von Helvenda geprüften Betreibungsregisterauszug
          und die 3×-Mietregel — das gilt für alle Inserate und ist nicht abschaltbar.
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="min-h-[52px] w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? 'Wird gespeichert…' : mode === 'edit' ? 'Änderungen speichern' : 'Inserat veröffentlichen'}
        </button>
      </form>
    </main>
  )
}
