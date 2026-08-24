/**
 * SIC-Produktbriefing (kompakt). Kein Produktcode.
 * node scripts/render-sic-produktbriefing.mjs
 */
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '../docs/sic-produktbriefing.pdf')

const NAVY = '#0a1f45'
const GOLD = '#b8912f'
const INK = '#1a2332'
const MUTED = '#5c6570'
const PAPER = '#fbf9f3'
const WHITE = '#ffffff'
const RED = '#8b1e2d'

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 52, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: 'Swiss Immo Cert — Produktbriefing (kompakt)',
    Author: 'Produkt',
    Subject: 'Conversion, Preiswahl, Uploads über Zeit',
  },
})

const stream = fs.createWriteStream(out)
doc.pipe(stream)

const L = 50
const W = () => doc.page.width - 100
const B = () => doc.page.height - 52

function bar() {
  doc.save()
  doc.rect(0, 0, doc.page.width, 6).fill(NAVY)
  doc.rect(0, 6, doc.page.width, 2).fill(GOLD)
  doc.restore()
}

function ensure(h) {
  if (doc.y + h > B()) {
    doc.addPage()
    bar()
    doc.y = 24
  }
}

function kicker(t) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GOLD).text(t.toUpperCase(), L, doc.y, {
    width: W(),
    characterSpacing: 1.1,
  })
  doc.moveDown(0.28)
}

function h1(t) {
  doc.font('Helvetica-Bold').fontSize(18).fillColor(NAVY).text(t, L, doc.y, { width: W(), lineGap: 1 })
  doc.moveDown(0.28)
}

function h2(t) {
  ensure(28)
  doc.moveDown(0.12)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text(t, L, doc.y, { width: W() })
  doc.moveDown(0.18)
}

function para(t) {
  ensure(32)
  doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(t, L, doc.y, {
    width: W(),
    lineGap: 2.2,
    align: 'justify',
  })
  doc.moveDown(0.28)
}

function bullet(t) {
  ensure(22)
  const y = doc.y
  doc.circle(L + 2.5, y + 4.5, 1.4).fill(GOLD)
  doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(t, L + 11, y, { width: W() - 11, lineGap: 1.6 })
  doc.moveDown(0.12)
}

function callout(title, lines) {
  const pad = 9
  doc.font('Helvetica').fontSize(8.5)
  let inner = 16
  for (const line of lines) {
    inner += doc.heightOfString(line, { width: W() - pad * 2, lineGap: 1.6 }) + 2
  }
  ensure(inner + 6)
  const y = doc.y
  const h = inner + 6
  doc.save()
  doc.roundedRect(L, y, W(), h, 3).fill(PAPER)
  doc.roundedRect(L, y, W(), h, 3).lineWidth(0.6).strokeColor(GOLD).stroke()
  doc.restore()
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text(title, L + pad, y + 7, { width: W() - pad * 2 })
  let ty = y + 20
  for (const line of lines) {
    doc.font('Helvetica').fontSize(8.5).fillColor(INK).text(line, L + pad, ty, {
      width: W() - pad * 2,
      lineGap: 1.6,
    })
    ty = doc.y + 2
  }
  doc.y = y + h + 8
}

function goldRule() {
  const y = doc.y
  doc.save()
  doc.moveTo(L, y).lineTo(L + 56, y).lineWidth(1.3).strokeColor(GOLD).stroke()
  doc.restore()
  doc.y = y + 9
}

function flow(items, lastNavy) {
  const n = items.length
  const gap = 6
  const w = (W() - gap * (n - 1)) / n
  ensure(48)
  const y = doc.y
  const h = 42
  items.forEach((label, i) => {
    const x = L + i * (w + gap)
    const last = lastNavy && i === n - 1
    doc.save()
    doc.roundedRect(x, y, w, h, 2.5).fill(last ? NAVY : WHITE)
    doc.roundedRect(x, y, w, h, 2.5).lineWidth(0.6).strokeColor(NAVY).stroke()
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(last ? WHITE : NAVY)
    doc.text(label, x + 3, y + 8, { width: w - 6, align: 'center', lineGap: 0.8 })
    doc.restore()
  })
  doc.y = y + h + 8
}

function twoCol(leftT, leftLines, rightT, rightLines) {
  const gap = 8
  const w = (W() - gap) / 2
  const pad = 8
  doc.font('Helvetica').fontSize(8)
  const hL = 18 + leftLines.reduce((s, t) => s + doc.heightOfString(t, { width: w - pad * 2, lineGap: 1.4 }) + 2, 0)
  const hR = 18 + rightLines.reduce((s, t) => s + doc.heightOfString(t, { width: w - pad * 2, lineGap: 1.4 }) + 2, 0)
  const h = Math.max(hL, hR) + 8
  ensure(h + 4)
  const y = doc.y
  ;[
    [L, leftT, leftLines],
    [L + w + gap, rightT, rightLines],
  ].forEach(([x, title, lines]) => {
    doc.save()
    doc.roundedRect(x, y, w, h, 3).fill(PAPER)
    doc.roundedRect(x, y, w, h, 3).lineWidth(0.6).strokeColor(GOLD).stroke()
    doc.restore()
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY).text(title, x + pad, y + 7, { width: w - pad * 2 })
    let ty = y + 19
    for (const line of lines) {
      doc.font('Helvetica').fontSize(8).fillColor(INK).text(line, x + pad, ty, { width: w - pad * 2, lineGap: 1.4 })
      ty = doc.y + 2
    }
  })
  doc.y = y + h + 8
}

function fourMini(cells) {
  const gap = 6
  const w = (W() - gap * 3) / 4
  const h = 70
  ensure(h + 4)
  const y = doc.y
  cells.forEach(([q, a], i) => {
    const x = L + i * (w + gap)
    doc.save()
    doc.roundedRect(x, y, w, h, 2.5).lineWidth(0.55).strokeColor(NAVY).stroke()
    doc.rect(x, y, w, 3).fill(GOLD)
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY).text(q, x + 4, y + 8, { width: w - 8, lineGap: 0.6 })
    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED).text(a, x + 4, y + 32, { width: w - 8, lineGap: 1 })
    doc.restore()
  })
  doc.y = y + h + 8
}

// ── S.1 ──────────────────────────────────────────────────────────────────
bar()
doc.y = 28
kicker('Internes Briefing  ·  kompakt  ·  August 2026')
h1('Swiss Immo Cert — was wir bauen')
goldRule()
para(
  'Ziel: ein ernstes Schweizer Dokument, das sich verkauft. Conversion heisst nicht möglichst viele Klicks auf der Startseite, sondern: Konto anlegen, Belege nach und nach einreichen, fertiges PDF mit QR — auch wenn dazwischen zwei Wochen liegen.'
)

callout('Zwei feste Produktregeln (ändern die frühere Empfehlung)', [
  'Preis: Der Nutzer darf Angaben weglassen und damit den Preis beeinflussen. Das ist gewollt — kein reines «alles oder nichts».',
  'Fertigstellung: Zu fast jeder Angabe gibt es eine Vorlage. Das Zertifikat wird erst fertig, wenn die gewählten Module mit den geforderten Uploads (Vorlagen) belegt sind. Der Bereich «Mein Zertifikat» bleibt über Tage und Wochen offen — selbstständiger Upload, jederzeit zurückkehren.',
])

h2('Was das für frühere Ideen heisst')
bullet('«Kein Konfigurator» gilt nur halb: Default bleibt das Komplett-Paket (alle vier). Weglassen ist erlaubt und muss den Preis klar zeigen — nicht verstecken, nicht als Spiel.')
bullet('«Unvollständiges PDF an den Vermieter» entfällt. Nach aussen gibt es kein fertiges Zertifikat, solange die gewählten Vorlagen fehlen. Nach innen: Status, Checkliste, offene Uploads.')
bullet('Time-to-PDF bleibt die Leitmetrik — aber «PDF» heisst fertig nach Prüfung der gewählten Module, nicht ein Zwischen-Blatt mit Lücken für den Vermieter.')

h2('Heute vs. Ziel (Journey)')
doc.font('Helvetica-Bold').fontSize(7.5).fillColor(RED).text('REIBUNG — zu viel Entscheiden, zu wenig Faden', L, doc.y)
doc.moveDown(0.2)
flow(['Schmerz', 'Module', 'Preis', 'E-Mail', 'Leeres Dossier', 'Upload verloren?'], false)
doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY).text('ZIEL — wählen, dann in Ruhe belegen', L, doc.y)
doc.moveDown(0.2)
flow(['Schmerz + Urkunde', 'Paket / weglassen', 'E-Mail', 'Dossier über Wochen', 'Vorlagen + Upload', 'Fertiges QR-PDF'], true)

// ── S.2 ──────────────────────────────────────────────────────────────────
doc.addPage()
bar()
doc.y = 22
kicker('Startseite und Preis')
h1('Ein Einstieg, echte Preiswahl')
para(
  'Die Startseite verkauft nicht vier Mini-Produkte, sondern ein Zertifikat mit vier möglichen Angaben. Alle vier sind vorausgewählt (stärkstes Dossier, meist bester Paketpreis). Wer weglässt, sieht sofort: welche Vermieterfrage offen bleibt und was das kostet bzw. spart. Kein Sterne-Score. Vollständigkeit = gewählte Angaben, nicht «Stärke 73».'
)
twoCol(
  'Default',
  [
    'Komplett vorausgewählt.',
    'Ein Satz: alle vier Fragen, die der Vermieter üblicherweise stellt.',
    'Paketpreis sichtbar, sobald er vom Einzelpreis abweicht (nicht bei CHF 0 vortäuschen).',
  ],
  'Weglassen',
  [
    'Erlaubt, weil es den Preis ändert.',
    'Jede Abwahl: «Diese Frage fehlt auf dem Zertifikat.»',
    'CTA bleibt derselbe: anlegen, dann im Dossier die Vorlagen für die gewählten Module.',
  ]
)

h2('Message — kurz und ehrlich')
para(
  'Ein PDF. Die Angaben, die du wählst. QR zum Prüfen. Keine Wohnungszusage. «Kostenlos» höchstens einmal, solange die Einführung gilt.'
)
fourMini([
  ['Betreibungen?', 'Auszug geprüft vor. Nicht: schuldenfrei garantiert.'],
  ['Einkommen?', 'Belegtes Einkommen. Nicht: kann DIESE Miete tragen.'],
  ['Als Mieter?', 'Vermieter-Vorlage. Nicht: Charakter-Note.'],
  ['Ausweis?', 'Identität / Bewilligung. Nicht: darf in dieser Wohnung leben.'],
])
para(
  '«Verifiziert» bleibt: vollständig und plausibel, kein Anruf bei Dritten. Das steht einmal klar, nicht als Angst-Disclaimer unter dem Knopf.'
)

h2('Was die Startseite nicht mehr tut')
bullet('Achtmal Preis/Gratis, doppelte Urkunde, doppelte Zusammenfassung, Versicherungs-Kacheln ohne Ende.')
bullet('Module so erklären, dass man raten muss. Pro Angabe: Vermieterfrage, was auf dem PDF steht, welche Vorlage du einreichst.')

// ── S.3 ──────────────────────────────────────────────────────────────────
doc.addPage()
bar()
doc.y = 22
kicker('Dossier, Vorlagen, Zeit')
h1('Zwei Wochen sind normal — das Konto muss das aushalten')
para(
  'Der Engpass ist nicht der Klick «Start». Es ist der Weg: SIC-Vorlage an Arbeitgeber oder bisherigen Vermieter, unterschreiben lassen, zurück hochladen. Das dauert. Wer nach drei Tagen den Link nicht mehr findet, ist verloren. Deshalb ist «Mein Zertifikat» das eigentliche Produkt nach der E-Mail — nicht die Landing.'
)
h2('Regeln für den Upload-Prozess')
bullet('Nach der E-Mail: Dossier mit nur den gewählten Modulen. Pro Modul: Vorlage herunterladen, ausfüllen lassen, hochladen (PDF/Foto).')
bullet('Status pro Angabe: Vorlage offen · hochgeladen · in Prüfung · verifiziert oder nachreichen.')
bullet('Jederzeit wieder rein: Magic Link, gleiche E-Mail, keine Frist von 48 Stunden für den ganzen Vorgang. Zwei Wochen (und mehr) sind vorgesehen.')
bullet('Erinnerungsmails an offene Vorlagen, nicht an «kauf noch ein Modul».')
bullet('Fertiges Zertifikat-PDF mit QR erst, wenn alle gewählten Module verifiziert sind. Vorher sieht nur der Nutzer den Fortschritt — der Vermieter bekommt kein halbfertiges Blatt.')

callout('Skizze Dossier (eine Seite, über die Zeit)', [
  'Kopf: Code, gewählte Angaben, Preis schon zugeordnet, Gültigkeit startet bei Ausstellung.',
  'Liste: Modul · Vorlage-Button · Upload · Status.',
  'Unten: «PDF herunterladen» aktiv erst wenn alles Gewählte geprüft ist. Sonst: «Noch offen: …».',
])

h2('Prüfseite (Vermieter)')
para(
  'Zehn Sekunden, kein Login: Name, Code, gültig/abgelaufen, nur die gewählten Zeilen, verifiziert. Ein Satz zur Art der Prüfung. Das ist der Grund, warum jemand das PDF überhaupt mitschickt.'
)

h2('Plattform und späterer Preis')
bullet('Eine Domain, E-Mail-Zugang, Header: anlegen oder Mein Zertifikat.')
bullet('Wenn Gebühren wieder gelten: weglassen senkt den Preis sichtbar; Komplett-Paket bleibt der klare Standard. Express (schnellere Prüfung) ist ein ehrlicher Aufpreis, kein Modul-Theater.')
bullet('Nicht: Sterne, Fake-Rabatt, Wohnungszusage, Portal-Scraping, Anrufe die der Text nicht deckt.')

h2('Umsetz-Reihenfolge')
bullet('1. Startseite: Default alle vier, Weglassen = Preis + fehlende Vermieterfrage, ein CTA.')
bullet('2. Dossier: Vorlagen, Upload, Haltbarkeit über Wochen, kein fertiges PDF vor Verifikation.')
bullet('3. PDF + QR-Prüfseite nur für abgeschlossene, gewählte Module.')
bullet('4. Mails: Link zurück ins Dossier, offene Vorlagen. Dann Bezahlpreis/Express.')

doc.moveDown(0.15)
goldRule()
doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Mitnehmen', L, doc.y)
doc.moveDown(0.25)
para(
  'Wählen darf den Preis ändern. Fertig ist das Zertifikat erst mit den Vorlagen der gewählten Angaben. Dazwischen gehört der Mensch in sein Dossier — nicht zurück auf eine Shop-Landing. Wer sucht, versteht: ein seriöses PDF statt fünf Anhängen. Wer prüft, versteht: QR und klare Zeilen. Wer unterwegs ist, versteht: ich kann in zwei Wochen weitermachen, ohne von vorn zu beginnen.'
)

const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
  doc.text('Swiss Immo Cert  ·  internes Briefing  ·  kompakt', L, doc.page.height - 32, {
    width: W() - 36,
    align: 'left',
  })
  doc.text(`${i - range.start + 1} / ${range.count}`, L, doc.page.height - 32, { width: W(), align: 'right' })
}

doc.end()
await new Promise((res, rej) => {
  stream.on('finish', res)
  stream.on('error', rej)
})
console.log(out)
