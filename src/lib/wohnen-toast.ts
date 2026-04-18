import type { CSSProperties } from 'react'
import toast from 'react-hot-toast'

const infoStyle: CSSProperties = {
  background: '#3b82f6',
  color: '#fff',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '14px',
}

/** Einheitliche Toasts für Helvenda Wohnungen (react-hot-toast). */
export const wohnenToast = {
  applicationSuccess: () => toast.success('Bewerbung erfolgreich abgeschickt ✅'),
  alreadyApplied: () =>
    toast('Du hast dich bereits auf diese Wohnung beworben', {
      icon: 'ℹ️',
      style: infoStyle,
      duration: 4000,
    }),
  profileSaved: () => toast.success('Profil erfolgreich gespeichert ✅'),
  creditVerified: () => toast.success('Betreibungsregister verifiziert ✅'),
  creditInvalid: () => toast.error('Dokument ungültig — bitte neuen Auszug hochladen'),
  viewingRequested: () => toast.success('Besichtigung erfolgreich angefragt ✅'),
  applicationRejected: () =>
    toast('Bewerbung als abgelehnt markiert', {
      icon: 'ℹ️',
      style: infoStyle,
      duration: 3500,
    }),
  listingSaved: () => toast.success('Inserat erfolgreich gespeichert ✅'),
  genericError: () => toast.error('Etwas ist schiefgelaufen — bitte versuche es erneut'),
}
