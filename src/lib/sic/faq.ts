import {
  formatSicChf,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicIsFree,
} from '@/lib/sic/modules'
import { SIC_DOCS_RETENTION_DAYS, SIC_UNFINISHED_DOCS_RETENTION_MONTHS } from '@/lib/sic/validity'

const PRICE_ANSWER =
  sicIsFree() ?
    'Momentan nichts. Wir sind am Anfang und wollen, dass Vermieter das Zertifikat kennenlernen.'
  : `Das vollständige Zertifikat mit allen ${SIC_MODULES.length} Angaben kostet ${formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)}. Bezahlt wird einmalig beim Anlegen — nicht pro Bewerbung und nicht als Abo.`

/** Shared FAQ for Landing + /sic/faq (single source of truth). Alltagssprache, kurze Antworten. */
export const SIC_FAQ: { q: string; a: string }[] = [
  {
    q: 'Bekomme ich damit eher die Wohnung?',
    a: 'Das entscheidet der Vermieter. Wir versprechen keine Zusage. Deine Bewerbung ist aber vollständig und auf einen Blick lesbar — statt fünf Anhänge, die niemand öffnet.',
  },
  {
    q: 'Was kostet es?',
    a: PRICE_ANSWER,
  },
  {
    q: `Warum genau diese ${SIC_MODULES.length} Angaben?`,
    a: 'Weil Vermieter fast immer dasselbe wissen wollen: Betreibungen, Lohn und Arbeitsstelle, wie es beim letzten Vermieter lief, und ob dein Ausweis gültig ist. Sind alle drin, muss er nicht nachfragen.',
  },
  {
    q: 'Was muss ich selbst besorgen?',
    a: 'Den Auszug vom Betreibungsamt, deinen Ausweis und deine Lohnabrechnung hast du selbst. Für Arbeitgeber und bisherigen Vermieter gibt es bei uns ein kurzes Formular zum Unterschreiben. Du kannst alles in deinem Tempo nachliefern.',
  },
  {
    q: 'Wie lange dauert es insgesamt?',
    a: 'Deine Unterlagen prüfen wir meist innert eines Werktags. Bis die unterschriebenen Formulare von Arbeitgeber und Vermieter zurück sind, gehen oft einige Tage bis mehrere Wochen ins Land — dieser Teil liegt nicht bei uns. Deshalb kannst du das PDF schon nutzen, wenn nur ein Teil geprüft ist.',
  },
  {
    q: 'Was steht am Ende auf dem Zertifikat?',
    a: 'Nicht deine Dokumente, sondern die geprüften Angaben in klarer Form: «Keine offenen Betreibungen, Auszug vom 12.06.2026», «Bruttojahreslohn CHF 90’000 – 110’000», «Tragbar bis CHF 2’500 Monatsmiete». Der exakte Lohn steht nie da.',
  },
  {
    q: 'Was heisst «geprüft»?',
    a: 'Wir schauen deine Unterlagen an: sind sie echt aussehend, vollständig, aktuell und plausibel? Danach übertragen wir die Angaben in standardisierter Form auf das Zertifikat. Wir rufen niemanden an — weder deinen Arbeitgeber noch deinen Vermieter.',
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
    a: 'Sobald die erste Angabe geprüft ist und dein Name erfasst ist. Auf dem Dokument steht offen, wie viele Angaben geprüft sind — der Vermieter weiss also genau, was er in der Hand hat, und du musst nicht wochenlang warten.',
  },
  {
    q: 'Wie lange ist das Zertifikat gültig?',
    a: `${SIC_VALIDITY_MONTHS} Monate — gerechnet ab der ersten Freigabe, nicht ab der Zahlung. Kommt später eine weitere geprüfte Angabe dazu, verlängert sich die Gültigkeit erneut auf ${SIC_VALIDITY_MONTHS} Monate.`,
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
    a: 'Im Dossier kannst du jederzeit einen neuen Code erzeugen. Der alte Link zeigt danach nichts mehr an — auch nicht bei Vermietern, denen du ihn schon gegeben hast.',
  },
  {
    q: 'Brauche ich ein Passwort?',
    a: 'Nein. Du gibst deine E-Mail an und bekommst einen Anmeldelink. Wenn er abgelaufen ist, forderst du einfach einen neuen an.',
  },
]
