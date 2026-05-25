'use client'

import type {
  ExternalLandlordContactKind,
  ExternalLandlordEvidenceSource,
  ExternalLandlordKind,
  ExternalLandlordPermissionKind,
  RentalListingStatus,
} from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

type ContactRow = {
  id: string
  kind: ExternalLandlordContactKind
  label: string | null
  value: string | null
  normalizedValue: string | null
  isPrimary: boolean
  note: string | null
  createdAt: string
}

type PermissionRow = {
  id: string
  kind: ExternalLandlordPermissionKind
  source: ExternalLandlordEvidenceSource
  grantedAt: string
  summary: string
  rentalListingId: string | null
  rentalListingTitle: string | null
}

type AttachmentRow = {
  id: string
  label: string | null
  fileName: string | null
  mimeType: string | null
  fileUrl: string
  note: string | null
  source: ExternalLandlordEvidenceSource | null
  createdAt: string
  rentalListingId: string | null
  permissionId: string | null
}

type LinkedListingRow = {
  id: string
  title: string
  address: string
  status: RentalListingStatus
  createdAt: string
}

type PotentialDuplicateRow = {
  id: string
  label: string
  secondary: string | null
  listingsCount: number
  contactsCount: number
  permissionsCount: number
  attachmentsCount: number
  sharedMatches: string[]
}

type Props = {
  landlordId: string
  displayName: string
  kind: ExternalLandlordKind
  normalizedPrimaryEmail: string | null
  normalizedPrimaryPhone: string | null
  internalNotes: string | null
  contacts: ContactRow[]
  permissions: PermissionRow[]
  attachments: AttachmentRow[]
  linkedListings: LinkedListingRow[]
  potentialDuplicates: PotentialDuplicateRow[]
}

const KIND_OPTIONS: Array<{ value: ExternalLandlordKind; label: string }> = [
  { value: 'unknown', label: 'Unklar' },
  { value: 'private', label: 'Privat' },
  { value: 'agency', label: 'Verwaltung / Agentur' },
]

const CONTACT_OPTIONS: Array<{ value: ExternalLandlordContactKind; label: string }> = [
  { value: 'email', label: 'E-Mail' },
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Andere' },
]

const PERMISSION_OPTIONS: Array<{ value: ExternalLandlordPermissionKind; label: string }> = [
  { value: 'listing_publication', label: 'Veröffentlichung Inserat' },
  { value: 'photo_use', label: 'Nutzung Bilder' },
  { value: 'text_use', label: 'Nutzung Texte' },
  { value: 'other', label: 'Andere' },
]

const SOURCE_OPTIONS: Array<{ value: ExternalLandlordEvidenceSource; label: string }> = [
  { value: 'manual', label: 'Manuell' },
  { value: 'email', label: 'E-Mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefon' },
  { value: 'sms', label: 'SMS' },
  { value: 'form', label: 'Formular / Direkt vom Vermieter' },
  { value: 'import_url', label: 'Import / URL' },
  { value: 'other', label: 'Andere' },
]

function statusLabel(status: RentalListingStatus): string {
  if (status === 'active') return 'Aktiv'
  if (status === 'rented') return 'Vermietet'
  return 'Archiviert'
}

export function ExternalLandlordDetailClient(props: Props) {
  const router = useRouter()

  const [displayName, setDisplayName] = useState(props.displayName)
  const [kind, setKind] = useState<ExternalLandlordKind>(props.kind)
  const [primaryEmail, setPrimaryEmail] = useState(props.normalizedPrimaryEmail ?? '')
  const [primaryPhone, setPrimaryPhone] = useState(props.normalizedPrimaryPhone ?? '')
  const [internalNotes, setInternalNotes] = useState(props.internalNotes ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [contactKind, setContactKind] = useState<ExternalLandlordContactKind>('email')
  const [contactLabel, setContactLabel] = useState('')
  const [contactValue, setContactValue] = useState('')
  const [contactNote, setContactNote] = useState('')
  const [contactPrimary, setContactPrimary] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  const [permissionKind, setPermissionKind] = useState<ExternalLandlordPermissionKind>('listing_publication')
  const [permissionSource, setPermissionSource] = useState<ExternalLandlordEvidenceSource>('manual')
  const [permissionSummary, setPermissionSummary] = useState('')
  const [permissionDate, setPermissionDate] = useState(new Date().toISOString().slice(0, 10))
  const [permissionListingId, setPermissionListingId] = useState('')
  const [savingPermission, setSavingPermission] = useState(false)
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null)

  const [attachmentLabel, setAttachmentLabel] = useState('')
  const [attachmentSource, setAttachmentSource] = useState<ExternalLandlordEvidenceSource>('manual')
  const [attachmentNote, setAttachmentNote] = useState('')
  const [attachmentListingId, setAttachmentListingId] = useState('')
  const [attachmentPermissionId, setAttachmentPermissionId] = useState('')
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null)
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState<File | null>(null)
  const [mergingDuplicateId, setMergingDuplicateId] = useState<string | null>(null)
  const [deletingEntryKey, setDeletingEntryKey] = useState<string | null>(null)

  const listingOptions = useMemo(
    () => props.linkedListings.map(listing => ({ value: listing.id, label: listing.title })),
    [props.linkedListings]
  )

  const mergeDuplicate = async (sourceLandlordId: string) => {
    if (!window.confirm('Diesen Duplikat-Datensatz in den aktuellen CRM-Eintrag zusammenführen?')) return
    setMergingDuplicateId(sourceLandlordId)
    try {
      const res = await fetch(`/api/admin/external-landlords/${sourceLandlordId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLandlordId: props.landlordId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Merge fehlgeschlagen')
        return
      }
      toast.success('Duplikat zusammengeführt')
      router.refresh()
    } finally {
      setMergingDuplicateId(null)
    }
  }

  const deleteEntry = async (entryKey: string, path: string, confirmText: string, successText: string) => {
    if (!window.confirm(confirmText)) return
    setDeletingEntryKey(entryKey)
    try {
      const res = await fetch(path, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Löschen fehlgeschlagen')
        return
      }
      toast.success(successText)
      router.refresh()
    } finally {
      setDeletingEntryKey(null)
    }
  }

  const resetContactForm = () => {
    setEditingContactId(null)
    setContactKind('email')
    setContactLabel('')
    setContactValue('')
    setContactNote('')
    setContactPrimary(false)
  }

  const resetPermissionForm = () => {
    setEditingPermissionId(null)
    setPermissionKind('listing_publication')
    setPermissionSource('manual')
    setPermissionSummary('')
    setPermissionDate(new Date().toISOString().slice(0, 10))
    setPermissionListingId('')
  }

  const resetAttachmentForm = () => {
    setEditingAttachmentId(null)
    setAttachmentLabel('')
    setAttachmentSource('manual')
    setAttachmentNote('')
    setAttachmentListingId('')
    setAttachmentPermissionId('')
    setSelectedAttachmentFile(null)
  }

  const startEditContact = (contact: ContactRow) => {
    setEditingContactId(contact.id)
    setContactKind(contact.kind)
    setContactLabel(contact.label ?? '')
    setContactValue(contact.value ?? '')
    setContactNote(contact.note ?? '')
    setContactPrimary(contact.isPrimary)
  }

  const startEditPermission = (permission: PermissionRow) => {
    setEditingPermissionId(permission.id)
    setPermissionKind(permission.kind)
    setPermissionSource(permission.source)
    setPermissionSummary(permission.summary)
    setPermissionDate(permission.grantedAt.slice(0, 10))
    setPermissionListingId(permission.rentalListingId ?? '')
  }

  const startEditAttachment = (attachment: AttachmentRow) => {
    setEditingAttachmentId(attachment.id)
    setAttachmentLabel(attachment.label ?? '')
    setAttachmentSource(attachment.source ?? 'manual')
    setAttachmentNote(attachment.note ?? '')
    setAttachmentListingId(attachment.rentalListingId ?? '')
    setAttachmentPermissionId(attachment.permissionId ?? '')
    setSelectedAttachmentFile(null)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/admin/external-landlords/${props.landlordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          kind,
          normalizedPrimaryEmail: primaryEmail,
          normalizedPrimaryPhone: primaryPhone,
          internalNotes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success('Profil gespeichert')
      router.refresh()
    } finally {
      setSavingProfile(false)
    }
  }

  const saveContact = async () => {
    setSavingContact(true)
    try {
      const path =
        editingContactId ?
          `/api/admin/external-landlords/${props.landlordId}/contacts/${editingContactId}`
        : `/api/admin/external-landlords/${props.landlordId}/contacts`
      const res = await fetch(path, {
        method: editingContactId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: contactKind,
          label: contactLabel,
          value: contactValue,
          note: contactNote,
          isPrimary: contactPrimary,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Kontakt konnte nicht gespeichert werden')
        return
      }
      toast.success(editingContactId ? 'Kontakt aktualisiert' : 'Kontakt gespeichert')
      resetContactForm()
      router.refresh()
    } finally {
      setSavingContact(false)
    }
  }

  const savePermission = async () => {
    setSavingPermission(true)
    try {
      const path =
        editingPermissionId ?
          `/api/admin/external-landlords/${props.landlordId}/permissions/${editingPermissionId}`
        : `/api/admin/external-landlords/${props.landlordId}/permissions`
      const res = await fetch(path, {
        method: editingPermissionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: permissionKind,
          source: permissionSource,
          summary: permissionSummary,
          grantedAt: permissionDate,
          rentalListingId: permissionListingId || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Berechtigung konnte nicht gespeichert werden')
        return
      }
      toast.success(editingPermissionId ? 'Berechtigung aktualisiert' : 'Berechtigung gespeichert')
      resetPermissionForm()
      router.refresh()
    } finally {
      setSavingPermission(false)
    }
  }

  const uploadAttachment = async (file: File | null) => {
    if (!file) return
    setUploadingAttachment(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'external-landlord-crm')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok || !(uploadData as { url?: string }).url) {
        toast.error((uploadData as { message?: string }).message || 'Upload fehlgeschlagen')
        return
      }

      const res = await fetch(`/api/admin/external-landlords/${props.landlordId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: attachmentLabel,
          source: attachmentSource,
          note: attachmentNote,
          rentalListingId: attachmentListingId || null,
          permissionId: attachmentPermissionId || null,
          fileUrl: (uploadData as { url: string }).url,
          fileName: (uploadData as { filename?: string }).filename ?? file.name,
          mimeType: (uploadData as { type?: string }).type ?? file.type,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Anhang konnte nicht gespeichert werden')
        return
      }
      toast.success('Anhang gespeichert')
      resetAttachmentForm()
      router.refresh()
    } finally {
      setUploadingAttachment(false)
    }
  }

  const saveAttachment = async () => {
    if (editingAttachmentId) {
      setUploadingAttachment(true)
      try {
        const res = await fetch(`/api/admin/external-landlords/${props.landlordId}/attachments/${editingAttachmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: attachmentLabel,
            source: attachmentSource,
            note: attachmentNote,
            rentalListingId: attachmentListingId || null,
            permissionId: attachmentPermissionId || null,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data as { message?: string }).message || 'Anhang konnte nicht gespeichert werden')
          return
        }
        toast.success('Anhang aktualisiert')
        resetAttachmentForm()
        router.refresh()
      } finally {
        setUploadingAttachment(false)
      }
      return
    }

    if (!selectedAttachmentFile) {
      toast.error('Bitte zuerst eine Datei auswählen')
      return
    }
    await uploadAttachment(selectedAttachmentFile)
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-800">Anzeigename</label>
              <input
                aria-label="Anzeigename"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Art</label>
              <select
                aria-label="Vermieter-Art"
                value={kind}
                onChange={e => setKind(e.target.value as ExternalLandlordKind)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {KIND_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Primär-E-Mail</label>
              <input
                aria-label="Primär-E-Mail"
                value={primaryEmail}
                onChange={e => setPrimaryEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800">Primär-Telefon</label>
              <input
                aria-label="Primär-Telefon"
                value={primaryPhone}
                onChange={e => setPrimaryPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-800">Interne Notizen</label>
              <textarea
                aria-label="Interne Notizen"
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verknüpfte Inserate</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{props.linkedListings.length}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Berechtigungen</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{props.permissions.length}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Anhänge</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{props.attachments.length}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void saveProfile()}
            disabled={savingProfile}
            className="inline-flex items-center justify-center rounded-lg bg-[#18a87c] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            Profil speichern
          </button>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Kontakte</h2>
          <div className="mt-4 space-y-3">
            {props.contacts.length === 0 ?
              <p className="text-sm text-slate-600">Noch keine Kontakte gespeichert.</p>
            : props.contacts.map(contact => (
                <div key={contact.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{contact.value || '—'}</p>
                        {contact.isPrimary ?
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                            Primär
                          </span>
                        : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {contact.kind}
                        {contact.label ? ` · ${contact.label}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => startEditContact(contact)}
                        className="text-xs font-semibold text-slate-500 underline hover:text-teal-700"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={deletingEntryKey === `contact:${contact.id}`}
                        onClick={() =>
                          void deleteEntry(
                            `contact:${contact.id}`,
                            `/api/admin/external-landlords/${props.landlordId}/contacts/${contact.id}`,
                            'Diesen Kontakt wirklich löschen?',
                            'Kontakt gelöscht'
                          )
                        }
                        className="text-xs font-semibold text-slate-500 underline hover:text-red-700 disabled:opacity-50"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  {contact.note ? <p className="mt-2 text-sm text-slate-700">{contact.note}</p> : null}
                </div>
              ))
            }
          </div>

          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">
                {editingContactId ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
              </p>
              {editingContactId ?
                <button
                  type="button"
                  onClick={resetContactForm}
                  className="text-xs font-semibold text-slate-500 underline hover:text-slate-700"
                >
                  Abbrechen
                </button>
              : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                aria-label="Kontakt-Art"
                value={contactKind}
                onChange={e => setContactKind(e.target.value as ExternalLandlordContactKind)}
                disabled={Boolean(editingContactId)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {CONTACT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                aria-label="Kontakt-Label"
                value={contactLabel}
                onChange={e => setContactLabel(e.target.value)}
                placeholder="Label (optional)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              aria-label="Kontaktwert"
              value={contactValue}
              onChange={e => setContactValue(e.target.value)}
              placeholder="Wert"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              aria-label="Kontakt-Notiz"
              value={contactNote}
              onChange={e => setContactNote(e.target.value)}
              placeholder="Notiz (optional)"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                aria-label="Primärkontakt markieren"
                type="checkbox"
                checked={contactPrimary}
                onChange={e => setContactPrimary(e.target.checked)}
              />
              Als Primärkontakt markieren
            </label>
            <button
              type="button"
              onClick={() => void saveContact()}
              disabled={savingContact}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {editingContactId ? 'Kontakt aktualisieren' : 'Kontakt speichern'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Berechtigungen</h2>
          <div className="mt-4 space-y-3">
            {props.permissions.length === 0 ?
              <p className="text-sm text-slate-600">Noch keine Berechtigungen erfasst.</p>
            : props.permissions.map(permission => (
                <div key={permission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{permission.kind}</p>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {permission.source}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(permission.grantedAt).toLocaleDateString('de-CH')}
                        {permission.rentalListingId && permission.rentalListingTitle ? ` · ${permission.rentalListingTitle}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => startEditPermission(permission)}
                        className="text-xs font-semibold text-slate-500 underline hover:text-teal-700"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={deletingEntryKey === `permission:${permission.id}`}
                        onClick={() =>
                          void deleteEntry(
                            `permission:${permission.id}`,
                            `/api/admin/external-landlords/${props.landlordId}/permissions/${permission.id}`,
                            'Diese Berechtigung wirklich löschen?',
                            'Berechtigung gelöscht'
                          )
                        }
                        className="text-xs font-semibold text-slate-500 underline hover:text-red-700 disabled:opacity-50"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{permission.summary}</p>
                </div>
              ))
            }
          </div>

          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">
                {editingPermissionId ? 'Berechtigung bearbeiten' : 'Berechtigung erfassen'}
              </p>
              {editingPermissionId ?
                <button
                  type="button"
                  onClick={resetPermissionForm}
                  className="text-xs font-semibold text-slate-500 underline hover:text-slate-700"
                >
                  Abbrechen
                </button>
              : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                aria-label="Berechtigungs-Art"
                value={permissionKind}
                onChange={e => setPermissionKind(e.target.value as ExternalLandlordPermissionKind)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {PERMISSION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Berechtigungs-Quelle"
                value={permissionSource}
                onChange={e => setPermissionSource(e.target.value as ExternalLandlordEvidenceSource)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {SOURCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                aria-label="Berechtigungs-Datum"
                type="date"
                value={permissionDate}
                onChange={e => setPermissionDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                aria-label="Verknüpftes Inserat für Berechtigung"
                value={permissionListingId}
                onChange={e => setPermissionListingId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Kein spezifisches Inserat</option>
                {listingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              aria-label="Berechtigungs-Zusammenfassung"
              value={permissionSummary}
              onChange={e => setPermissionSummary(e.target.value)}
              rows={4}
              placeholder="Was genau wurde erlaubt?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void savePermission()}
              disabled={savingPermission}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {editingPermissionId ? 'Berechtigung aktualisieren' : 'Berechtigung speichern'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Anhänge & Nachweise</h2>
        <div className="mt-4 space-y-3">
          {props.attachments.length === 0 ?
            <p className="text-sm text-slate-600">Noch keine Anhänge hochgeladen.</p>
          : props.attachments.map(attachment => (
              <div key={attachment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={attachment.fileUrl} target="_blank" className="font-semibold text-teal-800 hover:underline">
                        {attachment.label || attachment.fileName || 'Datei öffnen'}
                      </Link>
                      {attachment.source ?
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {attachment.source}
                        </span>
                      : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {attachment.fileName || 'Datei'}
                      {attachment.mimeType ? ` · ${attachment.mimeType}` : ''}
                      {' · '}
                      {new Date(attachment.createdAt).toLocaleString('de-CH')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => startEditAttachment(attachment)}
                      className="text-xs font-semibold text-slate-500 underline hover:text-teal-700"
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      disabled={deletingEntryKey === `attachment:${attachment.id}`}
                      onClick={() =>
                        void deleteEntry(
                          `attachment:${attachment.id}`,
                          `/api/admin/external-landlords/${props.landlordId}/attachments/${attachment.id}`,
                          'Diesen Anhang wirklich löschen?',
                          'Anhang gelöscht'
                        )
                      }
                      className="text-xs font-semibold text-slate-500 underline hover:text-red-700 disabled:opacity-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
                {attachment.note ? <p className="mt-2 text-sm text-slate-700">{attachment.note}</p> : null}
              </div>
            ))
          }
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">
              {editingAttachmentId ? 'Anhang bearbeiten' : 'Nachweis hochladen'}
            </p>
            {editingAttachmentId ?
              <button
                type="button"
                onClick={resetAttachmentForm}
                className="text-xs font-semibold text-slate-500 underline hover:text-slate-700"
              >
                Abbrechen
              </button>
            : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              aria-label="Anhang-Label"
              value={attachmentLabel}
              onChange={e => setAttachmentLabel(e.target.value)}
              placeholder="Label (z. B. WhatsApp-Freigabe)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              aria-label="Anhang-Quelle"
              value={attachmentSource}
              onChange={e => setAttachmentSource(e.target.value as ExternalLandlordEvidenceSource)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {SOURCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Verknüpftes Inserat für Anhang"
              value={attachmentListingId}
              onChange={e => setAttachmentListingId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Kein spezifisches Inserat</option>
              {listingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Verknüpfte Berechtigung für Anhang"
              value={attachmentPermissionId}
              onChange={e => setAttachmentPermissionId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Keine spezifische Berechtigung</option>
              {props.permissions.map(permission => (
                <option key={permission.id} value={permission.id}>
                  {permission.kind} · {new Date(permission.grantedAt).toLocaleDateString('de-CH')}
                </option>
              ))}
            </select>
          </div>
          <textarea
            aria-label="Anhang-Notiz"
            value={attachmentNote}
            onChange={e => setAttachmentNote(e.target.value)}
            rows={3}
            placeholder="Kurze Beschreibung"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {!editingAttachmentId ?
            <>
              <input
                aria-label="Anhang-Datei"
                type="file"
                accept="image/*,.pdf"
                onChange={e => setSelectedAttachmentFile(e.target.files?.[0] ?? null)}
                disabled={uploadingAttachment}
                className="block w-full text-sm text-slate-700"
              />
              {selectedAttachmentFile ?
                <p className="text-xs text-slate-600">Ausgewählt: {selectedAttachmentFile.name}</p>
              : null}
            </>
          : null}
          {editingAttachmentId ?
            <p className="text-xs text-slate-500">Beim Bearbeiten werden nur Metadaten geändert, nicht die Datei selbst.</p>
          : null}
          <button
            type="button"
            onClick={() => void saveAttachment()}
            disabled={uploadingAttachment}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {editingAttachmentId ? 'Anhang aktualisieren' : 'Anhang speichern'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Verknüpfte Inserate</h2>
        {props.linkedListings.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">Noch keine Inserate verknüpft.</p>
        : <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Titel</th>
                  <th className="pb-3 pr-4 font-semibold">Adresse</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {props.linkedListings.map(listing => (
                  <tr key={listing.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{listing.title}</td>
                    <td className="py-3 pr-4 text-slate-700">{listing.address}</td>
                    <td className="py-3 pr-4 text-slate-700">{statusLabel(listing.status)}</td>
                    <td className="py-3">
                      <Link href={`/admin/listings/${listing.id}/bearbeiten`} className="font-semibold text-teal-800 hover:underline">
                        Inserat öffnen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Potenzielle Duplikate</h2>
        {props.potentialDuplicates.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">Keine offensichtlichen Duplikate anhand E-Mail / Telefon gefunden.</p>
        : <div className="mt-4 space-y-3">
            {props.potentialDuplicates.map(duplicate => (
              <div key={duplicate.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{duplicate.label}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {duplicate.secondary || 'Kein zusätzlicher Primärkontakt'} · {duplicate.listingsCount} Inserate
                  </p>
                  <p className="mt-1 text-xs text-amber-950">
                    Gemeinsame Schlüssel: {duplicate.sharedMatches.length ? duplicate.sharedMatches.join(' · ') : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Merge-Vorschau: {duplicate.contactsCount} Kontakte · {duplicate.permissionsCount} Berechtigungen ·{' '}
                    {duplicate.attachmentsCount} Anhänge werden übernommen.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/landlords/${duplicate.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Öffnen
                  </Link>
                  <button
                    type="button"
                    disabled={mergingDuplicateId === duplicate.id}
                    onClick={() => void mergeDuplicate(duplicate.id)}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    In diesen Eintrag mergen
                  </button>
                </div>
              </div>
            ))}
          </div>
        }
      </section>
    </div>
  )
}
