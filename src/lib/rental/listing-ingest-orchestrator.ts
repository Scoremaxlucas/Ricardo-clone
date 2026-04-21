import { uploadImageToBlob } from '@/lib/blob-storage'
import { meetsMinImageSize } from '@/lib/rental/image-dimensions-buffer'
import {
  emptyAdminIngestRow,
  extractAdminIngestFromPlainText,
  extractFromVisionImages,
  mergeVisionIntoListing,
  type AdminIngestAiRow,
} from '@/lib/rental/listing-ingest-ai'
import { downloadRemoteImageBuffer } from '@/lib/rental/listing-ingest-download'
import { extractImageUrlsFromHtml } from '@/lib/rental/listing-ingest-html'
import { htmlToListingPlainText } from '@/lib/rental/listing-url-import-html'
import {
  assertUrlSafeForServerFetch,
  fetchListingHtml,
} from '@/lib/rental/listing-url-import-server'

export type AdminIngestMode = 'url' | 'text' | 'images_text' | 'combined'

export type AdminIngestPayload = {
  mode: AdminIngestMode
  url?: string
  text?: string
  imageUrls?: string[]
}

export type AdminIngestOrchestratorResult = {
  listing: AdminIngestAiRow
  photos: string[]
  sourceUrl: string | null
  imageDownloadFailures: number
  warnings: string[]
  errors: string[]
}

async function ingestImagesFromPageHtml(html: string, pageUrl: string, userId: string): Promise<{
  photos: string[]
  failures: number
}> {
  const urls = extractImageUrlsFromHtml(html, pageUrl)
  const photos: string[] = []
  let failures = 0
  for (const imgUrl of urls) {
    if (photos.length >= 10) break
    const got = await downloadRemoteImageBuffer(imgUrl, 5000)
    if (!got || !meetsMinImageSize(got.buffer)) {
      failures += 1
      continue
    }
    try {
      const ext = got.contentType === 'image/jpeg' ? 'jpg' : got.contentType === 'image/png' ? 'png' : 'webp'
      const path = `rental-listing-ingest/${userId}/${Date.now()}-${photos.length}.${ext}`
      const file = new File([new Uint8Array(got.buffer)], path.split('/').pop()!, { type: got.contentType })
      photos.push(await uploadImageToBlob(file, path))
    } catch {
      failures += 1
    }
  }
  return { photos, failures }
}

async function buffersForVisionFromUrls(urls: string[], max = 5): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[]> {
  const out: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[] = []
  for (const u of urls.slice(0, max)) {
    const got = await downloadRemoteImageBuffer(u, 5000)
    if (!got || !meetsMinImageSize(got.buffer)) continue
    out.push({ base64: got.buffer.toString('base64'), mediaType: got.contentType })
  }
  return out
}

async function normalizeClientImageUrls(
  userId: string,
  clientImages: string[]
): Promise<{ photos: string[]; failures: number }> {
  const photos: string[] = []
  let failures = 0
  for (const u of clientImages.slice(0, 10)) {
    const got = await downloadRemoteImageBuffer(u, 5000)
    if (!got || !meetsMinImageSize(got.buffer)) {
      failures += 1
      continue
    }
    try {
      if (u.includes('vercel-storage.com') || u.includes('public.blob.vercel-storage.com')) {
        photos.push(u)
        continue
      }
      const ext = got.contentType === 'image/jpeg' ? 'jpg' : got.contentType === 'image/png' ? 'png' : 'webp'
      const path = `rental-listing-ingest/${userId}/${Date.now()}-${photos.length}.${ext}`
      const file = new File([new Uint8Array(got.buffer)], path.split('/').pop()!, { type: got.contentType })
      photos.push(await uploadImageToBlob(file, path))
    } catch {
      failures += 1
    }
  }
  return { photos, failures }
}

export async function runAdminListingIngest(
  userId: string,
  payload: AdminIngestPayload
): Promise<AdminIngestOrchestratorResult> {
  const warnings: string[] = []
  const errors: string[] = []
  let imageDownloadFailures = 0
  let sourceUrl: string | null = null
  let photos: string[] = []

  const mode = payload.mode
  const text = (payload.text || '').trim()
  const url = (payload.url || '').trim()
  const clientImages = Array.isArray(payload.imageUrls) ? payload.imageUrls.filter(x => typeof x === 'string') : []

  if (mode === 'text') {
    if (!text) {
      errors.push('text_missing')
      return {
        listing: emptyAdminIngestRow(),
        photos,
        sourceUrl: null,
        imageDownloadFailures,
        warnings,
        errors,
      }
    }
    const ai = await extractAdminIngestFromPlainText(text)
    if (!ai) {
      errors.push('ai_parse_failed')
      warnings.push('Analyse fehlgeschlagen — Formular ist leer vorausgefüllt. Bitte manuell ausfüllen.')
    }
    return {
      listing: ai || emptyAdminIngestRow(),
      photos,
      sourceUrl: null,
      imageDownloadFailures,
      warnings,
      errors,
    }
  }

  if (mode === 'url' || mode === 'combined') {
    if (!url) {
      errors.push('url_missing')
      return {
        listing: emptyAdminIngestRow(),
        photos: [],
        sourceUrl: null,
        imageDownloadFailures,
        warnings,
        errors,
      }
    }
    sourceUrl = url
    let html = ''
    let httpStatus = 0
    try {
      const safe = await assertUrlSafeForServerFetch(url)
      const fetched = await fetchListingHtml(safe)
      html = fetched.html
      httpStatus = fetched.status
    } catch {
      errors.push('url_unreachable')
      warnings.push('Seite nicht erreichbar. Versuche Option B — Text einfügen.')
      if (mode === 'combined') {
        const { photos: cPhotos, failures } = await normalizeClientImageUrls(userId, clientImages)
        imageDownloadFailures += failures
        photos = cPhotos
        let listing: AdminIngestAiRow = emptyAdminIngestRow()
        if (photos.length) {
          const visionParts = await buffersForVisionFromUrls(photos)
          const vision = visionParts.length ? await extractFromVisionImages(visionParts) : null
          listing = mergeVisionIntoListing(listing, vision)
        }
        if (clientImages.length && cPhotos.length === 0) {
          warnings.push('Keine der hochgeladenen Bilder konnte validiert werden — bitte in Schritt 3 erneut hochladen.')
        }
        return { listing, photos, sourceUrl, imageDownloadFailures, warnings, errors }
      }
      return {
        listing: emptyAdminIngestRow(),
        photos: [],
        sourceUrl,
        imageDownloadFailures,
        warnings,
        errors,
      }
    }

    if (httpStatus === 403 || httpStatus === 401) {
      errors.push('url_blocked_http')
      warnings.push('Diese Seite blockiert automatischen Zugriff. Kopiere den Text manuell und nutze Option B.')
    } else if (httpStatus >= 400) {
      errors.push('url_http_error')
      warnings.push('Seite nicht erreichbar.')
    }

    const plain = htmlToListingPlainText(html, 8000)
    const ai = await extractAdminIngestFromPlainText(plain)
    if (!ai) {
      errors.push('ai_parse_failed')
      warnings.push('Analyse fehlgeschlagen — Formular ist leer vorausgefüllt. Bitte manuell ausfüllen.')
    }
    let listing: AdminIngestAiRow = ai || emptyAdminIngestRow()

    if (mode === 'url' && httpStatus < 400) {
      const { photos: fromPage, failures } = await ingestImagesFromPageHtml(html, url, userId)
      imageDownloadFailures += failures
      photos = fromPage
      if (fromPage.length === 0) {
        warnings.push('Keine Bilder gefunden — du kannst sie in Schritt 3 manuell hochladen.')
      }
      if (failures > 0) {
        warnings.push(`${failures} Bild(er) konnten nicht geladen werden.`)
      }
    }

    if (mode === 'combined') {
      const { photos: cPhotos, failures } = await normalizeClientImageUrls(userId, clientImages)
      imageDownloadFailures += failures
      photos = cPhotos
      if (clientImages.length && cPhotos.length === 0) {
        warnings.push('Keine der hochgeladenen Bilder konnte validiert werden — bitte in Schritt 3 erneut hochladen.')
      }
    }

    return { listing, photos, sourceUrl, imageDownloadFailures, warnings, errors }
  }

  // images_text
  const { photos: cPhotos, failures: cFail } = await normalizeClientImageUrls(userId, clientImages)
  imageDownloadFailures += cFail
  photos = cPhotos

  if (!text && photos.length === 0) {
    errors.push('no_input')
    return {
      listing: emptyAdminIngestRow(),
      photos,
      sourceUrl: null,
      imageDownloadFailures,
      warnings,
      errors,
    }
  }

  if (text) {
    const ai = await extractAdminIngestFromPlainText(text)
    let listing: AdminIngestAiRow = ai || emptyAdminIngestRow()
    if (!ai) {
      errors.push('ai_parse_failed')
      warnings.push('Analyse fehlgeschlagen — bitte manuell ausfüllen.')
    }
    if (photos.length) {
      const visionParts = await buffersForVisionFromUrls(photos)
      const vision = visionParts.length ? await extractFromVisionImages(visionParts) : null
      listing = mergeVisionIntoListing(listing, vision)
    }
    return { listing, photos, sourceUrl: null, imageDownloadFailures, warnings, errors }
  }

  const visionParts = await buffersForVisionFromUrls(photos)
  const vision = visionParts.length ? await extractFromVisionImages(visionParts) : null
  const listing = mergeVisionIntoListing(emptyAdminIngestRow(), vision)
  if (!vision) {
    errors.push('ai_parse_failed')
    warnings.push('Bildanalyse nicht möglich — bitte Text hinzufügen oder manuell ausfüllen.')
  }
  if (photos.length === 0) {
    warnings.push('Keine gültigen Bilder — bitte erneut hochladen.')
  }
  return { listing, photos, sourceUrl: null, imageDownloadFailures, warnings, errors }
}
