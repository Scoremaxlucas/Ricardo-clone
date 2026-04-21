'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { ingestOptionalText } from '@/lib/rental/ingest-optional-text'
import { mapAiImportToRentalLandlordInitial } from '@/lib/rental/listing-ai-to-rental-initial'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState, type ClipboardEvent } from 'react'
import toast from 'react-hot-toast'

const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'] as const

function roomsToSelect(r: number): string {
  if (r >= 5) return '5+'
  const s = String(r)
  return (ROOM_OPTIONS as readonly string[]).includes(s) ? s : '3'
}

/** Clipboard paste: nur echte Bild-Dateien (kein Text/HTML). */
function imageFilesFromClipboard(e: ClipboardEvent): File[] {
  const out: File[] = []
  const dt = e.clipboardData
  if (!dt?.items?.length) return out
  for (let i = 0; i < dt.items.length; i++) {
    const it = dt.items[i]
    if (it.kind !== 'file') continue
    if (!it.type.startsWith('image/')) continue
    const f = it.getAsFile()
    if (f) out.push(f)
  }
  return out
}

export type IngestPermissionBasis =
  | 'public_authority_url'
  | 'landlord_direct'
  | 'landlord_consent'
  | 'tutti_public'

type IngestCard = 'url' | 'text' | 'images_text' | 'combined' | 'screenshot'

type IngestListingRow = ImportListingAiResult & { landlordName?: string; landlordContact?: string }

type IngestApiResult = {
  success?: boolean
  listing: IngestListingRow
  photos: string[]
  sourceUrl: string | null
  imageDownloadFailures: number
  warnings: string[]
  errors: string[]
}

type IngestApiFailureBody = {
  success: false
  error?: string
  message?: string
  fallback?: boolean
  rawResponse?: string
  details?: string
  blocked?: boolean
  urlDetected?: string
}

/** Antwort für `type: text` / `type: url` — Felder unter `data`. */
type IngestUnifiedSuccessBody = {
  success: true
  data: Record<string, unknown>
  images?: string[]
  source?: 'text' | 'url' | 'screenshot' | string
}

const MAX_IMAGES = 10
const MAX_BYTES = 5 * 1024 * 1024
const SCREENSHOT_MAX = 5
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024

const ERROR_MESSAGES: Record<string, string> = {
  url_unreachable: 'Seite nicht erreichbar. Versuche Option B — Text einfügen.',
  url_blocked_http: 'Diese Seite blockiert automatischen Zugriff. Kopiere den Text manuell und nutze Option B.',
  platform_blocked: 'Diese Plattform blockiert automatischen Zugriff. Bitte Text manuell einfügen.',
  page_not_found: 'Inserat nicht gefunden (404/410).',
  url_http_error: 'Seite nicht erreichbar.',
  url_missing: 'Bitte eine URL angeben.',
  text_missing: 'Bitte Text einfügen.',
  no_input: 'Bitte Bilder oder Text angeben.',
  ai_parse_failed: 'Analyse fehlgeschlagen — Formular ist leer vorausgefüllt. Bitte manuell ausfüllen.',
}

function deriveImportMeta(
  basis: IngestPermissionBasis,
  recognizedSource: string
): { importSource: 'SELF' | 'IMPORTED'; importedFrom: string | null } {
  const r = recognizedSource.trim()
  if (basis === 'landlord_direct') {
    return { importSource: 'SELF', importedFrom: null }
  }
  if (basis === 'landlord_consent') {
    return { importSource: 'IMPORTED', importedFrom: r || null }
  }
  return { importSource: 'IMPORTED', importedFrom: r || null }
}

function buildLandlordPlain(name: string, contact: string, note: string): string | null {
  const parts: string[] = []
  if (name.trim()) parts.push(`Name: ${name.trim()}`)
  if (contact.trim()) parts.push(`Kontakt: ${contact.trim()}`)
  if (note.trim()) parts.push(`Notiz: ${note.trim()}`)
  return parts.length ? parts.join('\n') : null
}

function manualFallbackDescription(): string {
  return (
    'Automatische Analyse war nicht möglich oder unvollständig. Bitte alle Angaben manuell prüfen und ergänzen ' +
    '(mindestens 50 Zeichen in der Beschreibung).'
  )
}

export function IngestClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [card, setCard] = useState<IngestCard | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [clientImageUrls, setClientImageUrls] = useState<string[]>([])
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([])
  const [screenshotPreviewUrls, setScreenshotPreviewUrls] = useState<string[]>([])
  const [ingestSourceHint, setIngestSourceHint] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [analyzing, setAnalyzing] = useState(false)
  const [progressTick, setProgressTick] = useState(0)

  const [aiConfidence, setAiConfidence] = useState<'high' | 'medium' | 'low'>('low')
  const [sourceUrlMeta, setSourceUrlMeta] = useState<string | null>(null)

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
  const [depositAmount, setDepositAmount] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [description, setDescription] = useState('')
  const [requiresCreditCheck, setRequiresCreditCheck] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [recognizedSource, setRecognizedSource] = useState('')
  const [ingestBasis, setIngestBasis] = useState<IngestPermissionBasis>('landlord_direct')
  const [landlordConsentAck, setLandlordConsentAck] = useState(false)
  const [landlordName, setLandlordName] = useState('')
  const [landlordContact, setLandlordContact] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [postAnalyzeWarnings, setPostAnalyzeWarnings] = useState<string[]>([])

  const roomsValue = useMemo(() => (rooms === '5+' ? 5 : parseFloat(rooms)), [rooms])

  useEffect(() => {
    if (step !== 2 || !analyzing) return
    const t = setInterval(() => setProgressTick(x => (x + 1) % 20), 450)
    return () => clearInterval(t)
  }, [step, analyzing])

  useEffect(() => {
    const urls = screenshotFiles.map(f => URL.createObjectURL(f))
    setScreenshotPreviewUrls(urls)
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [screenshotFiles])

  const progressLabels = useMemo(() => {
    if (card === 'screenshot') {
      return [
        'Screenshots werden geladen…',
        'Claude analysiert die Bilder…',
        'Daten werden extrahiert…',
        'Formular wird vorbereitet…',
      ]
    }
    return ['Quelle wird geladen…', 'Daten werden extrahiert…', 'Bilder werden verarbeitet…', 'Inserat wird erstellt…']
  }, [card])

  const activeProgressIndex = analyzing ? Math.min(progressLabels.length - 1, Math.floor(progressTick / 5)) : 3

  const fieldAmber = useCallback(
    (isEmpty: boolean) => {
      return isEmpty || aiConfidence === 'low'
    },
    [aiConfidence]
  )

  const uploadFileArray = async (files: readonly File[]) => {
    if (!files.length || !userId) {
      if (!userId) toast.error('Bitte anmelden')
      return
    }
    setUploading(true)
    try {
      const next = [...clientImageUrls]
      for (let i = 0; i < files.length; i++) {
        if (next.length >= MAX_IMAGES) {
          toast.error(`Maximal ${MAX_IMAGES} Bilder`)
          break
        }
        const file = files[i]
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error('Nur JPG, PNG oder WebP')
          continue
        }
        if (file.size > MAX_BYTES) {
          toast.error('Maximal 5 MB pro Bild')
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
      setClientImageUrls(next)
    } finally {
      setUploading(false)
    }
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    await uploadFileArray(Array.from(files))
  }

  const uploadMoreReviewFiles = async (files: readonly File[]) => {
    if (!files.length || !userId) return
    setUploading(true)
    try {
      const next = [...imageUrls]
      for (let i = 0; i < files.length; i++) {
        if (next.length >= MAX_IMAGES) {
          toast.error(`Maximal ${MAX_IMAGES} Bilder`)
          break
        }
        const file = files[i]
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error('Nur JPG, PNG oder WebP')
          continue
        }
        if (file.size > MAX_BYTES) {
          toast.error('Maximal 5 MB pro Bild')
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

  const uploadMoreReview = async (files: FileList | null) => {
    if (!files?.length) return
    await uploadMoreReviewFiles(Array.from(files))
  }

  const applyAnalyzeToForm = useCallback((data: IngestApiResult) => {
    const row = data.listing as ImportListingAiResult
    const mapped = mapAiImportToRentalLandlordInitial(row)
    setTitle(mapped.title)
    setAddress(mapped.address)
    setZip(mapped.zip)
    setCity(mapped.city)
    setCanton(mapped.canton)
    setRooms(roomsToSelect(mapped.rooms))
    setAreaSqm(String(mapped.areaSqm))
    setFloor(mapped.floor != null ? String(mapped.floor) : '')
    setRentPerMonth(String(mapped.rentPerMonth))
    setUtilitiesPerMonth(mapped.utilitiesPerMonth != null ? String(mapped.utilitiesPerMonth) : '')
    setDepositAmount(mapped.depositAmount != null ? String(mapped.depositAmount) : '')
    setAvailableFrom(mapped.availableFrom.slice(0, 10))
    setDescription(mapped.description)
    setRequiresCreditCheck(mapped.requiresCreditCheck)
    setImageUrls(data.photos)
    setAiConfidence(row.confidence || 'low')
    setSourceUrlMeta(data.sourceUrl)
    const rec = (data.sourceUrl || row.originalPlatform || '').trim()
    setRecognizedSource(rec)
    if (data.sourceUrl?.toLowerCase().includes('tutti')) {
      setIngestBasis('tutti_public')
    } else if (data.sourceUrl) {
      setIngestBasis('public_authority_url')
    } else {
      setIngestBasis('landlord_direct')
    }
    setLandlordName(ingestOptionalText(data.listing.landlordName))
    setLandlordContact(ingestOptionalText(data.listing.landlordContact))
    setLandlordConsentAck(false)
    setInternalNote('')
  }, [])

  const applyEmptyFallback = useCallback(() => {
    const d = manualFallbackDescription()
    setTitle('')
    setAddress('')
    setZip('')
    setCity('')
    setCanton('')
    setRooms('3')
    setAreaSqm('')
    setFloor('')
    setRentPerMonth('')
    setUtilitiesPerMonth('')
    setDepositAmount('')
    setAvailableFrom(new Date().toISOString().slice(0, 10))
    setDescription(d)
    setImageUrls([])
    setAiConfidence('low')
    setRecognizedSource('')
    setIngestBasis('landlord_direct')
    setLandlordName('')
    setLandlordContact('')
    setLandlordConsentAck(false)
    setInternalNote('')
    setIngestSourceHint(null)
    setScreenshotFiles([])
  }, [])

  const addScreenshotFiles = (files: FileList | readonly File[] | null) => {
    if (!files?.length) return
    const list = files instanceof FileList ? Array.from(files) : [...files]
    const allowedMime = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      '',
    ])
    const next: File[] = [...screenshotFiles]
    for (let i = 0; i < list.length; i++) {
      if (next.length >= SCREENSHOT_MAX) {
        toast.error(`Maximal ${SCREENSHOT_MAX} Screenshots`)
        break
      }
      const f = list[i]
      const okMime = allowedMime.has(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)
      if (!okMime) {
        toast.error('Nur JPG, PNG, WebP oder HEIC')
        continue
      }
      if (f.size > SCREENSHOT_MAX_BYTES) {
        toast.error('Maximal 10 MB pro Screenshot')
        continue
      }
      next.push(f)
    }
    setScreenshotFiles(next.slice(0, SCREENSHOT_MAX))
  }

  const runAnalyze = async () => {
    if (!card) {
      toast.error('Bitte zuerst eine Quelle wählen.')
      return
    }
    let mode: 'url' | 'text' | 'images_text' | 'combined' = 'text'
    let url: string | undefined
    let text: string | undefined
    let imageUrls: string[] | undefined

    if (card === 'url') {
      mode = 'url'
      url = urlInput.trim()
      if (!url) {
        toast.error('Bitte eine URL einfügen.')
        return
      }
    } else if (card === 'text') {
      mode = 'text'
      text = textInput.trim()
      if (!text) {
        toast.error('Bitte Text einfügen.')
        return
      }
    } else if (card === 'images_text') {
      mode = 'images_text'
      text = textInput.trim()
      imageUrls = clientImageUrls
      if (!text && clientImageUrls.length === 0) {
        toast.error('Bitte Bilder und/oder Text angeben.')
        return
      }
    } else if (card === 'screenshot') {
      if (screenshotFiles.length === 0) {
        toast.error('Bitte mindestens einen Screenshot hochladen.')
        return
      }
    } else {
      mode = 'combined'
      url = urlInput.trim()
      imageUrls = clientImageUrls
      if (!url) {
        toast.error('Bitte eine URL einfügen.')
        return
      }
      if (clientImageUrls.length === 0) {
        toast.error('Bitte mindestens ein Bild hochladen.')
        return
      }
    }

    setStep(2)
    setAnalyzing(true)
    setProgressTick(0)
    setPostAnalyzeWarnings([])
    setIngestSourceHint(null)

    try {
      let response: Response
      if (card === 'screenshot') {
        const fd = new FormData()
        fd.append('type', 'screenshot')
        for (const f of screenshotFiles) {
          fd.append('images', f)
        }
        response = await fetch('/api/admin/ingest', { method: 'POST', body: fd })
      } else {
        const requestBody: Record<string, unknown> =
          card === 'text'
            ? { type: 'text', text: textInput.trim() }
            : card === 'url'
              ? { type: 'url', url: urlInput.trim() }
              : { mode, url, text, imageUrls }
        response = await fetch('/api/admin/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
      }
      const result = (await response.json().catch(() => null)) as Record<string, unknown> | null
      console.log('[INGEST CLIENT] API result:', result)
      if (card === 'screenshot') console.log('[INGEST SCREENSHOT] Result:', result)

      if (!result || typeof result !== 'object') {
        toast.error('Ungültige Server-Antwort')
        applyEmptyFallback()
        setPostAnalyzeWarnings([manualFallbackDescription()])
        setStep(3)
        return
      }

      if (result.success === false) {
        const fail = result as IngestApiFailureBody
        const msg =
          (typeof fail.message === 'string' && fail.message) ||
          'Analyse fehlgeschlagen. Bitte Formular manuell ausfüllen.'
        toast.error(msg)
        applyEmptyFallback()
        if (fail.blocked === true && typeof fail.urlDetected === 'string') {
          setRecognizedSource(fail.urlDetected)
          setIngestBasis(
            fail.urlDetected.toLowerCase().includes('tutti') ? 'tutti_public' : 'public_authority_url'
          )
        }
        const detailLine =
          typeof fail.details === 'string' && fail.details.trim()
            ? `Technisch: ${fail.details.trim().slice(0, 500)}${fail.details.length > 500 ? '…' : ''}`
            : null
        setPostAnalyzeWarnings([msg, ...(detailLine ? [detailLine] : [])])
        if (fail.error === 'AI_PARSE_FAILED' && fail.details) {
          console.error('[INGEST CLIENT] AI_PARSE_FAILED details:', fail.details)
        }
        setStep(3)
        return
      }

      if (
        result.success === true &&
        result.data &&
        typeof result.data === 'object' &&
        !Array.isArray(result.data)
      ) {
        const rawPayload = result as IngestUnifiedSuccessBody
        const d = rawPayload.data
        const features = Array.isArray(d.features)
          ? d.features.filter((x): x is string => typeof x === 'string')
          : []
        let desc = typeof d.description === 'string' ? d.description.trim() : ''
        if (features.length) {
          desc = [desc, `Ausstattung: ${features.join(', ')}`].filter(Boolean).join('\n\n')
        }
        if (desc.length < 50) {
          desc = `${desc}\n\n(Daten per Import übernommen — bitte prüfen und ergänzen.)`.trim()
        }
        setTitle(typeof d.title === 'string' ? d.title : '')
        setDescription(desc)
        setAddress(typeof d.address === 'string' ? d.address : '')
        setZip(typeof d.zip === 'string' ? d.zip.replace(/\D/g, '').slice(0, 4) : '')
        setCity(typeof d.city === 'string' ? d.city : '')
        setCanton(typeof d.canton === 'string' ? d.canton.trim().toUpperCase().slice(0, 2) : '')
        const roomsNum =
          typeof d.rooms === 'number' && Number.isFinite(d.rooms)
            ? d.rooms
            : parseFloat(String(d.rooms ?? '').replace(',', '.'))
        setRooms(roomsToSelect(Number.isFinite(roomsNum) ? roomsNum : 3))
        const area = d.areaSqm
        setAreaSqm(
          area != null && Number.isFinite(Number(area)) ? String(Math.round(Number(area))) : ''
        )
        const fl = d.floor
        setFloor(fl != null && Number.isFinite(Number(fl)) ? String(fl) : '')
        const rent = d.rentPerMonth
        setRentPerMonth(rent != null && Number.isFinite(Number(rent)) ? String(Math.round(Number(rent))) : '')
        const util = d.utilitiesPerMonth
        setUtilitiesPerMonth(
          util != null && Number.isFinite(Number(util)) ? String(Math.round(Number(util))) : ''
        )
        const dep = d.depositAmount
        setDepositAmount(dep != null && Number.isFinite(Number(dep)) ? String(Math.round(Number(dep))) : '')
        const avail = typeof d.availableFrom === 'string' ? d.availableFrom.trim() : ''
        setAvailableFrom(/^\d{4}-\d{2}-\d{2}$/.test(avail) ? avail : new Date().toISOString().slice(0, 10))
        setRequiresCreditCheck(true)
        const imgs = rawPayload.images
        setImageUrls(Array.isArray(imgs) ? imgs.filter((u): u is string => typeof u === 'string') : [])
        const conf = d.confidence
        setAiConfidence(conf === 'high' || conf === 'medium' || conf === 'low' ? conf : 'high')
        if (rawPayload.source === 'screenshot') {
          setIngestSourceHint(
            'Die Screenshots wurden analysiert. Wohnungsfotos für das Inserat kannst du unten manuell hochladen.'
          )
          setScreenshotFiles([])
          setSourceUrlMeta(null)
          setRecognizedSource('')
          setIngestBasis('landlord_direct')
        } else if (rawPayload.source === 'url' && card === 'url') {
          const u = urlInput.trim()
          setSourceUrlMeta(u)
          setRecognizedSource(u)
          setIngestBasis(u.toLowerCase().includes('tutti') ? 'tutti_public' : 'public_authority_url')
        } else {
          setSourceUrlMeta(null)
          setRecognizedSource('')
          setIngestBasis('landlord_direct')
        }
        setLandlordName(ingestOptionalText(d.landlordName))
        setLandlordContact(ingestOptionalText(d.landlordContact))
        setLandlordConsentAck(false)
        setInternalNote('')
        setPostAnalyzeWarnings([])
        const filledCount = Object.entries(d).filter(([key, v]) => {
          if (key === 'features') return Array.isArray(v) && v.length > 0
          if (v === null || v === undefined) return false
          if (typeof v === 'string') return v.trim().length > 0
          if (typeof v === 'number') return Number.isFinite(v)
          return false
        }).length
        toast.success(
          rawPayload.source === 'screenshot'
            ? 'Screenshot erfolgreich analysiert ✅'
            : `Analyse erfolgreich — ${filledCount} Felder erkannt`
        )
        setStep(3)
        return
      }

      if (result.success === true && 'listing' in result) {
        const data = result as unknown as IngestApiResult
        applyAnalyzeToForm(data)
        const errMsgs = (data.errors || []).map(e => ERROR_MESSAGES[e] || e).filter(Boolean)
        const extra: string[] = [...(data.warnings || [])]
        if (typeof data.imageDownloadFailures === 'number' && data.imageDownloadFailures > 0) {
          extra.push(`${data.imageDownloadFailures} Bild(er) konnten nicht geladen werden`)
        }
        setPostAnalyzeWarnings([...extra, ...errMsgs.map(e => String(e))])
        for (const code of data.errors || []) {
          const m = ERROR_MESSAGES[code]
          if (m) toast.error(m)
        }
        setStep(3)
        return
      }

      if (!response.ok) {
        toast.error((result.message as string) || 'Analyse fehlgeschlagen')
        applyEmptyFallback()
        setPostAnalyzeWarnings([manualFallbackDescription()])
        setStep(3)
        return
      }

      toast.error('Analyse fehlgeschlagen')
      applyEmptyFallback()
      setPostAnalyzeWarnings([manualFallbackDescription()])
      setStep(3)
    } catch {
      toast.error('Analyse fehlgeschlagen')
      applyEmptyFallback()
      setPostAnalyzeWarnings(['Netzwerkfehler — bitte Daten manuell prüfen.'])
      setStep(3)
    } finally {
      setAnalyzing(false)
    }
  }

  const reorder = (from: number, to: number) => {
    setImageUrls(prev => {
      const n = [...prev]
      const [x] = n.splice(from, 1)
      n.splice(to, 0, x)
      return n
    })
  }

  const removeAt = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrls.length > MAX_IMAGES) {
      toast.error(`Maximal ${MAX_IMAGES} Fotos`)
      return
    }
    if (description.trim().length < 50) {
      toast.error('Beschreibung mindestens 50 Zeichen')
      return
    }
    if (ingestBasis === 'landlord_consent' && !landlordConsentAck) {
      toast.error('Bitte bestätigen: Vermieter hat ausdrücklich zugestimmt.')
      return
    }
    const { importSource, importedFrom } = deriveImportMeta(ingestBasis, recognizedSource)
    if (importSource === 'IMPORTED' && !importedFrom && ingestBasis !== 'landlord_consent') {
      toast.error('Bitte die erkannte Quelle / URL ergänzen.')
      return
    }
    if (
      (ingestBasis === 'public_authority_url' || ingestBasis === 'tutti_public') &&
      !recognizedSource.trim()
    ) {
      toast.error('Bitte die Quelle (URL) ergänzen.')
      return
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
        requiresCreditCheck,
        photos: imageUrls,
        importSource,
        importedFrom,
        landlordContactPlain: buildLandlordPlain(landlordName, landlordContact, internalNote),
        status: publishNow ? 'active' : 'archived',
        ingestPermissionBasis: ingestBasis,
        landlordConsentAck: ingestBasis === 'landlord_consent' ? landlordConsentAck : false,
      }

      const res = await fetch('/api/admin/rental-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success('Inserat erfolgreich erstellt ✅')
      router.push('/admin/listings')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    !submitting &&
    description.trim().length >= 50 &&
    imageUrls.length <= MAX_IMAGES &&
    rentPerMonth !== '' &&
    !Number.isNaN(parseInt(rentPerMonth, 10)) &&
    areaSqm !== '' &&
    !Number.isNaN(parseInt(areaSqm, 10))

  const cardClass = (c: IngestCard) =>
    `flex flex-col rounded-2xl border p-5 text-left shadow-sm transition ${
      card === c ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-400' : 'border-slate-200 bg-white hover:border-teal-300'
    }`

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-4">
        <Link href="/admin/listings" className="text-sm font-medium text-teal-800 hover:underline">
          ← Zurück zur Verwaltung
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Admin</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Neues Inserat — Automatischer Import</h1>

      {step === 1 ?
        <div className="mt-8 space-y-8">
          <p className="text-sm text-slate-600">Schritt 1 — Quelle wählen</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button type="button" className={cardClass('url')} onClick={() => setCard('url')}>
              <span className="text-2xl" aria-hidden>
                🔗
              </span>
              <span className="mt-2 text-lg font-bold text-slate-900">Von URL importieren</span>
              <span className="mt-2 text-sm text-slate-600">
                Füge eine URL ein — wir extrahieren alle Daten und Bilder automatisch.
              </span>
              <span className="mt-3 text-xs text-slate-500">
                Geeignet für: Tutti.ch, öffentliche Behördenseiten, andere erlaubte Quellen
              </span>
            </button>
            <button type="button" className={cardClass('text')} onClick={() => setCard('text')}>
              <span className="text-2xl" aria-hidden>
                📋
              </span>
              <span className="mt-2 text-lg font-bold text-slate-900">Text einfügen</span>
              <span className="mt-2 text-sm text-slate-600">
                E-Mail, WhatsApp, PDF-Inhalt — wir strukturieren alles automatisch.
              </span>
              <span className="mt-3 text-xs text-slate-500">Geeignet für: Daten per E-Mail/WhatsApp vom Vermieter</span>
            </button>
            <button type="button" className={cardClass('images_text')} onClick={() => setCard('images_text')}>
              <span className="text-2xl" aria-hidden>
                🖼️
              </span>
              <span className="mt-2 text-lg font-bold text-slate-900">Bilder + Beschreibung</span>
              <span className="mt-2 text-sm text-slate-600">
                Bilder hochladen und optional Text — wir erstellen das Inserat automatisch.
              </span>
              <span className="mt-3 text-xs text-slate-500">Geeignet für: Fotos per WhatsApp/E-Mail</span>
            </button>
            <button type="button" className={cardClass('combined')} onClick={() => setCard('combined')}>
              <span className="text-2xl" aria-hidden>
                ⚡
              </span>
              <span className="mt-2 text-lg font-bold text-slate-900">URL + Bilder kombinieren</span>
              <span className="mt-2 text-sm text-slate-600">
                URL für Textdaten + eigene Bilder, falls Originalbilder fehlen oder schlecht sind.
              </span>
              <span className="mt-3 text-xs text-slate-500">Kombination aus Webseite und Upload</span>
            </button>
            <button type="button" className={cardClass('screenshot')} onClick={() => setCard('screenshot')}>
              <span className="text-2xl" aria-hidden>
                📸
              </span>
              <span className="mt-2 text-lg font-bold text-slate-900">Screenshot hochladen</span>
              <span className="mt-2 text-sm text-slate-600">
                Mache einen Screenshot des Inserats und lade ihn hoch. Funktioniert auch wenn die Plattform
                automatischen Zugriff blockiert.
              </span>
              <span className="mt-3 text-xs text-slate-500">
                Geeignet für: Tutti, Homegate, Facebook & Co., wenn URL-Import scheitert
              </span>
            </button>
          </div>

          {card === 'url' || card === 'combined' ?
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://…"
              />
            </div>
          : null}

          {card === 'text' || card === 'images_text' ?
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Text</label>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={card === 'text' ? 14 : 6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Inseratstext, E-Mail, Notizen …"
              />
            </div>
          : null}

          {card === 'screenshot' ?
            <div
              tabIndex={0}
              role="group"
              aria-label="Screenshot-Bereich"
              className="rounded-xl border-2 border-dashed border-teal-300/80 bg-teal-50/40 p-6 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              onDragOver={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={e => {
                e.preventDefault()
                addScreenshotFiles(e.dataTransfer.files)
              }}
              onPaste={e => {
                const pasted = imageFilesFromClipboard(e)
                if (!pasted.length) return
                e.preventDefault()
                addScreenshotFiles(pasted)
              }}
            >
              <p className="text-sm font-semibold text-slate-800">
                Screenshots (JPG, PNG, WebP; max. {SCREENSHOT_MAX}, je max. 10 MB — HEIC bitte vorher als JPG exportieren)
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                multiple
                disabled={uploading}
                onChange={e => addScreenshotFiles(e.target.files)}
                className="mt-3 w-full text-sm"
              />
              <p className="mt-2 text-xs text-slate-600">
                Tipp: Scrolle durch das Inserat und mache mehrere Screenshots, um alle Infos zu erfassen. Bild aus der
                Zwischenablage: Bereich anklicken, dann ⌘V / Strg+V.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {screenshotPreviewUrls.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bg-black/60 px-1.5 text-sm text-white"
                      aria-label="Entfernen"
                      onClick={() => setScreenshotFiles(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          : null}

          {card === 'images_text' || card === 'combined' ?
            <div
              tabIndex={0}
              role="group"
              aria-label="Bild-Upload"
              className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              onDragOver={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={e => {
                e.preventDefault()
                void uploadFiles(e.dataTransfer.files)
              }}
              onPaste={e => {
                const pasted = imageFilesFromClipboard(e)
                if (!pasted.length) return
                e.preventDefault()
                void uploadFileArray(pasted)
              }}
            >
              <p className="text-sm font-semibold text-slate-800">Bilder (JPG/PNG/WebP, max. 10, je max. 5 MB)</p>
              <p className="mt-1 text-xs text-slate-600">
                Aus Zwischenablage: Bereich anklicken, dann ⌘V / Strg+V (nur Bilder, kein reiner Text).
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading || !userId}
                onChange={e => void uploadFiles(e.target.files)}
                className="mt-3 w-full text-sm"
              />
              {uploading ?
                <p className="mt-2 text-xs text-slate-500">Lade hoch…</p>
              : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {clientImageUrls.map((u, idx) => (
                  <div key={`${u}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bg-black/60 px-1 text-xs text-white"
                      onClick={() => setClientImageUrls(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          : null}

          <button
            type="button"
            disabled={!card || (card === 'screenshot' && screenshotFiles.length === 0)}
            onClick={() => void runAnalyze()}
            className="w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-40"
          >
            {card === 'screenshot' ? 'Screenshots analysieren' : 'Analysieren'}
          </button>
        </div>
      : null}

      {step === 2 ?
        <div className="mt-10 space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Schritt 2 — Automatische Verarbeitung</p>
          <ul className="space-y-3 text-sm text-slate-700">
            {progressLabels.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className={i <= activeProgressIndex ? 'text-emerald-600' : 'text-slate-300'}>
                  {i <= activeProgressIndex ? '✓' : '…'}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      : null}

      {step === 3 ?
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <p className="text-sm font-semibold text-slate-800">Schritt 3 — Review + Bestätigung</p>

          {ingestSourceHint ?
            <div className="rounded-xl border border-teal-200 bg-teal-50/90 p-4 text-sm text-teal-950">
              <p className="font-semibold text-teal-900">Hinweis</p>
              <p className="mt-1">{ingestSourceHint}</p>
            </div>
          : null}

          {postAnalyzeWarnings.length ?
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
              <p className="font-semibold">Hinweise</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {postAnalyzeWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          : null}

          <div
            tabIndex={0}
            role="group"
            aria-label="Bilder im Review"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              void uploadMoreReview(e.dataTransfer.files)
            }}
            onPaste={e => {
              const pasted = imageFilesFromClipboard(e)
              if (!pasted.length) return
              e.preventDefault()
              void uploadMoreReviewFiles(pasted)
            }}
          >
            <p className="text-sm font-bold text-slate-900">Bilder</p>
            <p className="text-xs text-slate-600">
              Reihenfolge per Drag-and-drop ändern. Erstes Bild = Hauptbild. Aus Zwischenablage: diesen Bereich
              anklicken, dann ⌘V / Strg+V.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {imageUrls.map((u, idx) => (
                <div
                  key={`${u}-${idx}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx == null || dragIdx === idx) return
                    reorder(dragIdx, idx)
                    setDragIdx(null)
                  }}
                  className="relative h-24 w-24 cursor-grab overflow-hidden rounded-lg border border-slate-200 active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  {idx === 0 ?
                    <span className="absolute bottom-1 left-1 rounded bg-teal-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Hauptbild
                    </span>
                  : null}
                  <button
                    type="button"
                    className="absolute right-0 top-0 bg-black/60 px-1 text-xs text-white"
                    onClick={() => removeAt(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              id="ingest-more-photos"
              className="hidden"
              disabled={uploading || !userId}
              onChange={e => void uploadMoreReview(e.target.files)}
            />
            <label
              htmlFor="ingest-more-photos"
              className="mt-3 inline-block cursor-pointer rounded-lg border border-teal-600 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
            >
              Weitere Bilder hinzufügen
            </label>
            {uploading ?
              <p className="mt-2 text-xs text-slate-500">Lade hoch…</p>
            : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Titel *</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  fieldAmber(!title.trim()) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                }`}
              />
              {fieldAmber(!title.trim()) ?
                <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
              : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Adresse *</label>
              <input
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  fieldAmber(!address.trim()) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                }`}
              />
              {fieldAmber(!address.trim()) ?
                <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
              : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">PLZ *</label>
                <input
                  required
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    fieldAmber(!zip.trim()) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                  }`}
                />
                {fieldAmber(!zip.trim()) ?
                  <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
                : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ort *</label>
                <input
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    fieldAmber(!city.trim()) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                  }`}
                />
                {fieldAmber(!city.trim()) ?
                  <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
                : null}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kanton *</label>
              <select
                required
                value={canton}
                onChange={e => setCanton(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  fieldAmber(!canton) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                }`}
              >
                <option value="">Bitte wählen</option>
                {SWISS_CANTONS.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              {fieldAmber(!canton) ?
                <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
              : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Zimmer *</label>
                <select
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Fläche m² *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={areaSqm}
                  onChange={e => setAreaSqm(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    fieldAmber(!areaSqm.trim() || Number(areaSqm) < 1)
                      ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200'
                      : 'border-slate-300'
                  }`}
                />
                {fieldAmber(!areaSqm.trim() || Number(areaSqm) < 1) ?
                  <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
                : null}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Etage (optional)</label>
              <input
                type="number"
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Miete CHF *</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={rentPerMonth}
                  onChange={e => setRentPerMonth(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    fieldAmber(!rentPerMonth.trim() || Number(rentPerMonth) <= 0)
                      ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200'
                      : 'border-slate-300'
                  }`}
                />
                {fieldAmber(!rentPerMonth.trim() || Number(rentPerMonth) <= 0) ?
                  <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
                : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nebenkosten (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={utilitiesPerMonth}
                  onChange={e => setUtilitiesPerMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kaution (optional)</label>
              <input
                type="number"
                min={0}
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Verfügbar ab *</label>
              <input
                required
                type="date"
                value={availableFrom}
                onChange={e => setAvailableFrom(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  fieldAmber(!availableFrom) ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200' : 'border-slate-300'
                }`}
              />
              {fieldAmber(!availableFrom) ?
                <p className="mt-1 text-xs text-amber-800">Bitte prüfen</p>
              : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Beschreibung *</label>
              <textarea
                required
                minLength={50}
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  fieldAmber(description.trim().length < 50)
                    ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200'
                    : 'border-slate-300'
                }`}
              />
              {fieldAmber(description.trim().length < 50) ?
                <p className="mt-1 text-xs text-amber-800">Bitte prüfen (mind. 50 Zeichen)</p>
              : null}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-teal-100 bg-teal-50/40 p-3">
              <input
                type="checkbox"
                checked={requiresCreditCheck}
                onChange={e => setRequiresCreditCheck(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">Betreibungsregisterauszug von Interessenten erforderlich</span>
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/40 p-5">
            <p className="text-sm font-bold text-rose-900">Quelle (Admin)</p>
            {sourceUrlMeta ?
              <p className="break-all text-xs text-slate-700">
                <span className="font-semibold">Erkannt: </span>
                {sourceUrlMeta}
              </p>
            : null}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Erkannte Quelle / URL</label>
              <input
                type="text"
                value={recognizedSource}
                onChange={e => setRecognizedSource(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="z. B. https://… oder «WhatsApp»"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Erlaubnis-Basis</label>
              <select
                value={ingestBasis}
                onChange={e => setIngestBasis(e.target.value as IngestPermissionBasis)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="public_authority_url">URL importiert — öffentliche Behördenquelle</option>
                <option value="landlord_direct">Vermieter hat Daten direkt übermittelt</option>
                <option value="landlord_consent">Erlaubnis vom Vermieter erhalten</option>
                <option value="tutti_public">Tutti.ch — öffentliches Inserat</option>
              </select>
            </div>
            {ingestBasis === 'landlord_consent' ?
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-900">
                <input
                  type="checkbox"
                  checked={landlordConsentAck}
                  onChange={e => setLandlordConsentAck(e.target.checked)}
                  className="mt-1"
                />
                <span>Vermieter hat ausdrücklich zugestimmt *</span>
              </label>
            : null}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Vermieter-Kontakt (nur intern sichtbar)</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={landlordName}
                onChange={e => setLandlordName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefon oder E-Mail</label>
              <input
                value={landlordContact}
                onChange={e => setLandlordContact(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Interne Notiz</label>
              <textarea
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nur für Admins …"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">Publikation</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="pub" checked={publishNow} onChange={() => setPublishNow(true)} />
                Sofort veröffentlichen
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="pub" checked={!publishNow} onChange={() => setPublishNow(false)} />
                Als Entwurf speichern (archiviert)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-[#18a87c] py-4 text-base font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? 'Wird erstellt…' : 'Inserat erstellen'}
          </button>
        </form>
      : null}
    </main>
  )
}
