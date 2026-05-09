import type { CSSProperties } from 'react'
import toast from 'react-hot-toast'

const infoStyle: CSSProperties = {
  background: '#107a5a',
  color: '#fff',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 500,
  boxShadow: '0 10px 28px rgba(13, 43, 31, 0.12)',
}

/** Einheitliche Toasts für Helvenda Wohnungen (react-hot-toast). */
export const wohnenToast = {
  applicationSuccess: () => toast.success('Bewerbung erfolgreich abgeschickt'),
  alreadyApplied: () =>
    toast('Du hast dich bereits auf diese Wohnung beworben', {
      style: infoStyle,
      duration: 4000,
    }),
  profileSaved: () => toast.success('Profil erfolgreich gespeichert'),
  creditVerified: () => toast.success('Betreibungsregisterauszug verifiziert'),
  creditInvalid: () => toast.error('Dokument ungültig — bitte neuen Auszug hochladen'),
  viewingRequested: () => toast.success('Besichtigung erfolgreich angefragt'),
  applicationRejected: () =>
    toast('Bewerbung als abgelehnt markiert', {
      style: infoStyle,
      duration: 3500,
    }),
  listingSaved: () => toast.success('Inserat erfolgreich gespeichert'),
  genericError: () => toast.error('Etwas ist schiefgelaufen — bitte versuche es erneut'),
}
