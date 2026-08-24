/**
 * SIC-Briefing, 2 volle Seiten. node scripts/render-sic-produktbriefing.mjs
 */
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '../docs/sic-produktbriefing.pdf')

const NAVY = '#0a1f45'
const GOLD = '#b8912f'
const INK = '#1c2430'
const MUTED = '#5a6270'
const PAPER = '#f7f4ec'
const WHITE = '#ffffff'

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 44, bottom: 40, left: 48, right: 48 },
  bufferPages: true,
  info: { Title: 'SIC — kritisch: heute vs. morgen', Author: 'Produkt' },
})

const stream = fs.createWriteStream(out)
doc.pipe(stream)

const L = 48
const PW = 499
const MAX = 760

function header() {
  doc.rect(0, 0, doc.page.width, 5).fill(NAVY)
  doc.rect(0, 5, doc.page.width, 2).fill(GOLD)
}

function need(h) {
  if (doc.y + h > MAX) {
    doc.addPage()
    header()
    doc.y = 24
  }
}

function kicker(t) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GOLD).text(t.toUpperCase(), L, doc.y, {
    width: PW,
    characterSpacing: 1,
  })
  doc.moveDown(0.3)
}

function title(t) {
  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY).text(t, L, doc.y, { width: PW })
  doc.moveDown(0.35)
}

function h(t) {
  doc.font('Helvetica-Bold').fontSize(11)
  need(doc.heightOfString(t, { width: PW }) + 14)
  doc.moveDown(0.12)
  doc.fillColor(NAVY).text(t, L, doc.y, { width: PW })
  doc.moveDown(0.18)
}

function p(t) {
  doc.font('Helvetica').fontSize(9.5)
  need(doc.heightOfString(t, { width: PW, lineGap: 2 }) + 12)
  doc.fillColor(INK).text(t, L, doc.y, { width: PW, lineGap: 2 })
  doc.moveDown(0.3)
}

function b(t) {
  doc.font('Helvetica').fontSize(9.5)
  const ht = doc.heightOfString(t, { width: PW - 12, lineGap: 1.4 }) + 8
  need(ht)
  const y = doc.y
  doc.circle(L + 2, y + 4, 1.25).fill(GOLD)
  doc.fillColor(INK).text(t, L + 11, y, { width: PW - 12, lineGap: 1.4 })
  doc.moveDown(0.1)
}

function box(title, body) {
  const pad = 8
  doc.font('Helvetica').fontSize(9)
  const th = 13
  const bh = doc.heightOfString(body, { width: PW - pad * 2, lineGap: 1.6 })
  const hgt = th + bh + pad * 2
  need(hgt + 4)
  const y = doc.y
  doc.save()
  doc.roundedRect(L, y, PW, hgt, 3).fill(PAPER)
  doc.roundedRect(L, y, PW, hgt, 3).lineWidth(0.6).strokeColor(GOLD).stroke()
  doc.restore()
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text(title, L + pad, y + pad, { width: PW - pad * 2 })
  doc.font('Helvetica').fontSize(9).fillColor(INK).text(body, L + pad, y + pad + th, {
    width: PW - pad * 2,
    lineGap: 1.6,
  })
  doc.y = y + hgt + 7
}

header()
doc.y = 22
kicker('Internes Briefing  ·  kritisch  ·  August 2026')
title('SIC: Was sich wirklich ändern muss')
p(
  'Kurzes Urteil: Die «grosse Idee», ein Zertifikat mit allen vier Modulen vorausgewählt und Vermieterfragen auf den Kacheln, ist im Kern die Startseite von heute. Das ist kein neuer Aufbau. Der Unterschied ist klein. Wer Conversion will, muss nach der E-Mail bauen — Vorlagen, wochenlanger Upload, PDF erst wenn die gewählten Belege geprüft sind. Den Rest der Landing schönzureden oder umzubauen, ist Zeitverschwendung.'
)
box(
  'Als SIC-Hilfe, ohne Schonung',
  'Den Builder nicht abschaffen: Ihr wollt, dass Weglassen den Preis ändert. Dafür braucht ihr genau diese Wahl. Default alle vier habt ihr schon. Was fehlt, ist kein neues Hero — es ist ein Dossier, das zwei Wochen überlebt.'
)
h('Was live schon da ist')
b('Hero, Urkunde, QR, keine Wohnungszusage.')
b('Schmerz, fünf Dateien gegen ein PDF, vier Schritte.')
b('Builder: vier Module an, Balken 1–4, Vermieterfrage, Nutzen, Beleg.')
b('Paket-Zeile, Basis, E-Mail, Checkout (jetzt CHF 0).')
h('Heute gegen morgen — ehrlich')
b('Wahl: bleibt. Bei echtem Preis Betrag und Ersparnis zeigen, nicht bei null durchstreichen.')
b('Balken: bleibt. Keine Sterne.')
b('Nach der Mail: Lücke. Vorlagen laden, hochladen, Status, Link über 2–3 Wochen.')
b('PDF an den Vermieter: erst wenn gewählte Module inkl. Vorlagen verifiziert sind. Kein Lücken-Blatt.')
p(
  'Die Startseite ist laut und etwas lang, aber die Kette Schmerz → Beweis → wählen → Mail trägt. Eine fünfte Hero-Variante ändert die Conversion nicht.'
)

doc.addPage()
header()
doc.y = 24
kicker('Wo es kippt')
title('Nach dem Klick: Vorlagen, Wochen, Preis')
h('1. Dossier (Pflicht)')
p(
  'Fast jede Angabe braucht eine Vorlage, die ein Dritter unterschreibt. Das dauert Tage. Ist der Link tot oder unklar, was fehlt, ist die Conversion null — egal wie die Landing aussieht.'
)
b('Gleiche E-Mail, neuer Link, jederzeit, mindestens zwei bis drei Wochen.')
b('Pro gewähltes Modul: Vorlage → ausfüllen lassen → Upload → offen / hochgeladen / Prüfung / verifiziert / nachreichen.')
b('Nur gewählte Module. Weggelassenes später erweitern, nicht in derselben Session als Schuld verkaufen.')
b('Vermieter-PDF grau, bis alles Gewählte verifiziert ist. Der Nutzer sieht den Fortschritt.')
b('Mails: Link zurück ins Dossier; «noch offen: Arbeitgeberbestätigung» — nicht «noch ein Modul kaufen».')
h('2. Preis')
p(
  'Weglassen soll den Preis ändern. Dann muss man die Änderung sehen. Bei CHF 0 gibt es nichts zu beeinflussen — kein Fake-Rabatt. Komplett vorausgewählt bleibt Standard. Abwahl: neuer Preis plus «Auf dem Zertifikat fehlt dann …». Kein Sterne-Kauf.'
)
h('3. Copy, die schadet')
p(
  '«Kann er die Miete tragen?» und «Darf er hier wohnen?» klingen nach Garantie. Ihr prüft Vollständigkeit und Plausibilität. Besser: belegtes Einkommen; Ausweis oder Bewilligung liegt vor. Weniger Drama, mehr Vertrauen.'
)
h('4. Finger weg')
b('Du-Form, keine Zusage, Urkunde, 5 gegen 1, Default alle vier.')
b('Kein Score. Kein halbfertiges Zertifikat an den Vermieter.')
b('Landing nicht ohne Builder — ihr braucht die Wahl für den Preis.')
h('Reihenfolge')
b('Zuerst Dossier (Vorlagen, Upload, Haltbarkeit, PDF erst fertig).')
b('Dann Landing kürzen: ehrliche Fragen, ein «kostenlos».')
b('Dann echte Preise an die Kacheln. QR-Prüfseite: zehn Sekunden, kein Login.')
box(
  'Mitnehmen',
  'Die Startseite muss nicht neu erfunden werden. SIC wird besser, wenn jemand zwei Wochen lang weiss, wo die Vorlagen liegen, und erst danach ein fertiges Dokument hat. Ein neuer Shop ohne dieses Dossier ist Beschäftigung, keine Conversion.'
)

const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
  doc.text('Swiss Immo Cert  ·  internes Briefing  ·  kritisch', L, 792, {
    width: PW - 50,
    lineBreak: false,
  })
  doc.text(`${i - range.start + 1} / ${range.count}`, L, 792, { width: PW, align: 'right', lineBreak: false })
}

doc.end()
await new Promise((res, rej) => {
  stream.on('finish', res)
  stream.on('error', rej)
})
console.log(out)
