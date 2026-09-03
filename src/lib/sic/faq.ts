import {
  formatSicChf,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicIsFree,
  sicSealRequirementLabel,
} from '@/lib/sic/modules'
import { SIC_REVIEW_SLA } from '@/lib/sic/config'
import { SIC_CERT_PREVIEW_FACTS, sicFactLines } from '@/lib/sic/facts'
import { SIC_DOCS_RETENTION_DAYS, SIC_UNFINISHED_DOCS_RETENTION_MONTHS } from '@/lib/sic/validity'

const PREVIEW_BONITAET = sicFactLines('BONITAET', SIC_CERT_PREVIEW_FACTS.BONITAET)
const PREVIEW_INCOME = sicFactLines('ARBEIT_EINKOMMEN', SIC_CERT_PREVIEW_FACTS.ARBEIT_EINKOMMEN)
const PREVIEW_INCOME_BAND = PREVIEW_INCOME.find(l => l.startsWith('Bruttojahreslohn')) ?? ''
const PREVIEW_CEILING = PREVIEW_INCOME.find(l => l.startsWith('Tragbar')) ?? ''

const PRICE_ANSWER =
  sicIsFree() ?
    'Momentan nichts. Du kannst das Zertifikat ohne Abo anlegen und der Bewerbung beilegen.'
  : `Das vollständige Zertifikat mit allen ${SIC_MODULES.length} Angaben kostet ${formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)}. Bezahlt wird einmalig beim Anlegen — nicht pro Bewerbung und nicht als Abo.`

/** Shared FAQ for Landing + /sic/faq (single source of truth). Alltagssprache, kurze Antworten. */
export const SIC_FAQ: { q: string; a: string }[] = [
  {
    q: 'Bekomme ich damit eher die Wohnung?',
    a: 'Das entscheidet der Vermieter — eine Zusage versprechen wir nicht. Was wir ändern: er sieht geprüfte Angaben statt Selbstauskunft. Ob er dich berücksichtigt, bleibt seine Entscheidung.',
  },
  {
    q: 'Haben das nicht alle Bewerber?',
    a: 'Nein. Nicht jeder legt geprüfte Angaben vor. Das Zertifikat weist aus, was geprüft ist — und bleibt damit ein Unterscheidungsmerkmal.',
  },
  {
    q: 'Was kostet es?',
    a: PRICE_ANSWER,
  },
  {
    q: 'Kann ich nur einzelne Angaben kaufen?',
    a: 'Beim Anlegen gehören alle vier dazu. Fehlt später etwas, ergänzt du es unter «Mein Zertifikat» — nicht als Baukasten auf der Startseite.',
  },
  {
    q: `Warum genau diese ${SIC_MODULES.length} Angaben?`,
    a: 'Weil Vermieter fast immer dasselbe wissen wollen: Betreibungen, Lohn und Arbeitsstelle, wie es beim letzten Vermieter lief, und ob der Ausweis gültig ist. Sind alle vier geprüft, steht das in einheitlicher Form da. Was fehlt, ist nicht ausgewiesen.',
  },
  {
    q: 'Was muss ich selbst besorgen?',
    a: 'Den Auszug vom Betreibungsamt, deinen Ausweis und deine Lohnabrechnung hast du selbst. Für Arbeitgeber und bisherigen Vermieter gibt es bei uns ein kurzes Formular zum Unterschreiben. Du kannst alles in deinem Tempo nachliefern.',
  },
  {
    q: 'Wie lange dauert es insgesamt?',
    a: `Deine Unterlagen prüfen wir ${SIC_REVIEW_SLA}. Bis die unterschriebenen Formulare von Arbeitgeber und Vermieter zurück sind, gehen oft einige Tage bis mehrere Wochen ins Land — dieser Teil liegt nicht bei uns. Deshalb kannst du das PDF schon nutzen, wenn nur ein Teil geprüft ist.`,
  },
  {
    q: 'Was steht am Ende auf dem Zertifikat?',
    a: `Nicht deine Dokumente, sondern die geprüften Angaben in klarer Form: «${PREVIEW_BONITAET.join(', ')}», «${PREVIEW_INCOME_BAND}», «${PREVIEW_CEILING}». Der exakte Lohn steht nie da.`,
  },
  {
    q: 'Was heisst «geprüft»?',
    a: 'Wir schauen deine Unterlagen an: sind sie echt aussehend, vollständig, aktuell und plausibel? Danach stehen die Angaben in einheitlicher Form auf dem Zertifikat. Das ist keine behördliche Auskunft und keine Bonitätsbewertung. Wir rufen niemanden an — weder deinen Arbeitgeber noch deinen Vermieter.',
  },
  {
    q: 'Was, wenn eine Angabe nicht passt?',
    a: 'Dann sagen wir dir per E-Mail, was fehlt, und du reichst neue Unterlagen nach — ohne Zusatzkosten. Ist der Inhalt selbst negativ, etwa offene Betreibungen, erscheint die Angabe gar nicht auf dem Zertifikat. Ein Negativurteil über dich schreiben wir nirgends hin.',
  },
  {
    q: 'Wer sieht meine Unterlagen?',
    a: 'Nur wir, für die Prüfung. Der Vermieter sieht das fertige Zertifikat, das du ihm selbst weitergibst — nicht deine Dokumente. Zur Vorbereitung liest ein KI-Dienst die Unterlagen aus und schlägt Werte vor; freigeben tut immer ein Mensch.',
  },
  {
    q: 'Wann bekomme ich das PDF?',
    a: `Ein PDF mit dem Stand der Prüfung, sobald die erste Angabe geprüft ist und dein Name erfasst ist. Das Mieter-Zertifikat — mit Siegel — gibt es, sobald ${sicSealRequirementLabel()} geprüft sind.`,
  },
  {
    q: 'Wie lange ist das Zertifikat gültig?',
    a: `${SIC_VALIDITY_MONTHS} Monate — gerechnet ab dem Datum des Betreibungsauszugs, nicht ab der Zahlung. Andere geprüfte Angaben verlängern die Frist nicht. Fehlt der Auszug noch, gilt eine vorläufige Frist ab der ersten Freigabe, bis der Auszug geprüft ist.`,
  },
  {
    q: 'Und wenn es abgelaufen ist?',
    a: `Verlängern kostet ${formatSicChf(SIC_RENEWAL_FEE_CHF)}. Dafür brauchst du einen frischen Betreibungsauszug, weil der schnell veraltet. Deine Vermieter-Referenz bleibt bestehen; Lohn und Ausweis nur dann neu, wenn sie zu alt beziehungsweise abgelaufen sind.`,
  },
  {
    q: 'Verfällt eine bezahlte Angabe, wenn ich mir Zeit lasse?',
    a: `Nein. Bezahlte Angaben bleiben dir. Nur die hochgeladenen Dateien löschen wir aus Datenschutzgründen: ${SIC_DOCS_RETENTION_DAYS} Tage nach Ablauf des Zertifikats, bei unfertigen Zertifikaten ${SIC_UNFINISHED_DOCS_RETENTION_MONTHS} Monate nach dem Kauf. Vorher warnen wir dich per E-Mail, und du kannst danach ohne neue Zahlung erneut hochladen.`,
  },
  {
    q: 'Was, wenn mein QR-Code in falsche Hände gerät?',
    a: 'Im Workspace «Mein Zertifikat» kannst du jederzeit einen neuen Code erzeugen. Der alte Link zeigt danach nichts mehr an — auch nicht bei Vermietern, denen du ihn schon gegeben hast.',
  },
  {
    q: 'Brauche ich ein Passwort?',
    a: 'Nein. Du gibst deine E-Mail an und bekommst einen Anmeldelink. Auf der Seite tippst du auf «Anmelden» — erst dann wirst du eingeloggt. Nach der Zahlung bleibst du auf dem Gerät sieben Tage angemeldet. Wenn der Link abgelaufen ist, forderst du einfach einen neuen an.',
  },
  {
    q: 'Was, wenn ich die E-Mail falsch geschrieben habe?',
    a: 'Unter «Mein Zertifikat» kannst du sie einmal ändern. Wir schreiben an die neue Adresse — dort tippst du auf «Bestätigen». An die bisherige Adresse geht eine Mitteilung. Danach bleibt die neue Adresse dein Zugang.',
  },
]
