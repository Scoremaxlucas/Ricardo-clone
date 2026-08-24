/**
 * SIC-Briefing: aktuell vs. besser, dicht, eine Spalte (keine leeren Seiten).
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
const INK = '#1c2430'
const MUTED = '#5a6270'
const PAPER = '#f7f4ec'
const LINE = '#cfc6b4'
const WHITE = '#ffffff'

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 48, bottom: 48, left: 48, right: 48 },
  bufferPages: true,
  info: {
    Title: 'SIC — kritisch: heute vs. morgen',
    Author: 'Produkt',
  },
})

const stream = fs.createWriteStream(out)
doc.pipe(stream)

const L = 48
const PW = 499

function header() {
  doc.rect(0, 0, doc.page.width, 5).fill(NAVY)
  doc.rect(0, 5, doc.page.width, 2).fill(GOLD)
}

function need(h) {
  if (doc.y + h > 780) {
    doc.addPage()
    header()
    doc.y = 22
  }
}

function kicker(t) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GOLD).text(t.toUpperCase(), L, doc.y, {
    width: PW,
    characterSpacing: 1,
  })
  doc.y += 12
}

function title(t) {
  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY).text(t, L, doc.y, { width: PW })
  doc.y += 20
}

function h(t) {
  need(28)
  doc.y += 6
  doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text(t, L, doc.y, { width: PW })
  doc.y += 16
}

function p(t) {
  need(36)
  doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(t, L, doc.y, {
    width: PW,
    lineGap: 2,
    align: 'left',
  })
  doc.y += 8
}

function b(t) {
  need(22)
  const y = doc.y
  doc.circle(L + 2, y + 4, 1.3).fill(GOLD)
  doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(t, L + 11, y, { width: PW - 11, lineGap: 1.5 })
  doc.y += 5
}

function box(title, body) {
  const pad = 8
  doc.font('Helvetica').fontSize(9)
  const th = 14
  const bh = doc.heightOfString(body, { width: PW - pad * 2, lineGap: 1.8 })
  const hgt = th + bh + pad * 2
  need(hgt + 6)
  const y = doc.y
  doc.save()
  doc.roundedRect(L, y, PW, hgt, 3).fill(PAPER)
  doc.roundedRect(L, y, PW, hgt, 3).lineWidth(0.6).strokeColor(GOLD).stroke()
  doc.restore()
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text(title, L + pad, y + pad, { width: PW - pad * 2 })
  doc.font('Helvetica').fontSize(9).fillColor(INK).text(body, L + pad, y + pad + th, {
    width: PW - pad * 2,
    lineGap: 1.8,
  })
  doc.y = y + hgt + 8
}

function table(headers, rows) {
  const cols = headers.length
  const widths = cols === 3 ? [118, 190, 191] : [PW / cols, PW / cols]
  const fs = 8
  need(20 + rows.length * 36)
  let x = L
  let y = doc.y
  doc.save()
  doc.rect(L, y, PW, 16).fill(NAVY)
  doc.restore()
  headers.forEach((hd, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(WHITE).text(hd, x + 4, y + 4, { width: widths[i] - 8 })
    x += widths[i]
  })
  y += 16
  rows.forEach((row, ri) => {
    const heights = row.map((cell, i) =>
      doc.font('Helvetica').fontSize(fs).heightOfString(String(cell), { width: widths[i] - 8, lineGap: 1.2 })
    )
    const rh = Math.max(18, ...heights) + 8
    if (y + rh > 775) {
      doc.addPage()
      header()
      y = 22
    }
    if (ri % 2 === 0) {
      doc.save()
      doc.rect(L, y, PW, rh).fill('#f3f1ea')
      doc.restore()
    }
    doc.save()
    doc.rect(L, y, PW, rh).lineWidth(0.3).strokeColor(LINE).stroke()
    doc.restore()
    x = L
    row.forEach((cell, i) => {
      doc
        .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(fs)
        .fillColor(INK)
        .text(String(cell), x + 4, y + 4, { width: widths[i] - 8, lineGap: 1.2 })
      x += widths[i]
    })
    y += rh
  })
  doc.y = y + 10
}

// PAGE 1 — Urteil
header()
doc.y = 22
kicker('Internes Briefing  ·  kritisch  ·  August 2026')
title('SIC: Was sich wirklich ändern muss')
p(
  'Kurzes Urteil vorweg: Die erste «grosse Idee» (ein Zertifikat, alle vier Module vorausgewählt, Vermieterfragen auf den Kacheln) ist im Kern das, was die Startseite schon tut. Wer das PDF als Revolution liest, hat recht, verwirrt zu sein. Der Unterschied zur Live-Seite ist klein. Der Unterschied, der Conversion und Betrieb rettet, liegt nach der E-Mail — und den habt ihr in den Produktregeln selbst genannt.'
)

box(
  'Harte Linie als SIC-Hilfe',
  'Nicht die Landing neu erfinden, weil uns der Builder zu «SaaS» vorkommt. Den Builder lassen — er ist euer Preisinstrument. Stattdessen das Dossier bauen, das zwei Wochen Upload aushält, Vorlagen ausgibt, und das PDF erst dann «fertig» nennt, wenn die gewählten Belege geprüft sind. Alles andere ist Kosmetik.'
)

h('Was heute schon da ist (nicht so tun, als fehle es)')
b('Hero: Unterlagen, keine Antwort; Urkunde mit QR; Disclaimer ohne Wohnungszusage.')
b('Schmerz + 5 Dateien vs. 1 PDF.')
b('Vier Schritte: E-Mail, Upload, 24h, PDF.')
b('Builder: alle vier Module an; Vollständigkeit 4/4; Vermieterfrage + Nutzen + «du reichst ein».')
b('Komplett-Paket-Zeile; Basis; E-Mail; Checkout (aktuell CHF 0).')

h('Was die alte Empfehlung «ein Produkt, kein Shop» wirklich war')
p(
  'Gemeint war: auf der Startseite nicht vier Kaufentscheide. Bei euch gilt aber: Module weglassen soll den Preis ändern. Dann braucht ihr den Builder. Default alle vier ist bereits euer Weg. Ein zweites Mal «verkauft ein Zertifikat, nicht Module» zu predigen, ohne den Preishebel zu nennen, war unklar und wirkte nach leerem Redesign.'
)

table(
  ['Thema', 'Heute (Live)', 'Besser / nötig'],
  [
    [
      'Modulwahl',
      'Alle vier an. Abwählen geht. Preis überall «Kostenlos».',
      'Genau so lassen. Sobald Preise > 0: neben jeder Kachel der Betrag, beim Abwählen die Ersparnis, Paket vs. einzeln ehrlich.',
    ],
    [
      'Vollständigkeit',
      'Balken 1–4, Text «offene Frage».',
      'Behalten. Keine Sterne. Optional: «wirkt auf den Preis» in denselben Satz, wenn Gebühren leben.',
    ],
    [
      'Start-CTA',
      'Kostenlos starten → Builder → E-Mail.',
      'Reicht. Nicht noch ein zweiter Konfigurator. «Kostenlos» nicht achtmal.',
    ],
    [
      'Nach der E-Mail',
      'Bereich Mein Zertifikat existiert. Ob Vorlagen + wochenlanger Upload als Hauptweg sitzen, ist die offene Baustelle.',
      'Das ist die eigentliche Produktarbeit. Siehe nächste Seite.',
    ],
    [
      'Fertiges PDF',
      'Logik im Briefing vorher: evtl. Zwischen-PDF mit Lücken.',
      'Verworfen. PDF mit QR für den Vermieter erst, wenn gewählte Module inkl. Vorlagen verifiziert sind.',
    ],
  ]
)

p(
  'Fazit Seite 1: Die Startseite ist nicht das Loch. Sie ist etwas laut und etwas lang, aber die Logik (Schmerz → Beweis → wählen → Mail) ist tragfähig. Wer Conversion retten will, investiert nicht in eine fünfte Hero-Variante.'
)

// PAGE 2 — Dossier / Preis / Copy
doc.addPage()
header()
doc.y = 22
kicker('Wo Conversion wirklich stirbt')
title('Nach dem Klick: Vorlagen, Wochen, Preis')

h('1. Dossier über die Zeit (Pflicht, nicht Nice-to-have)')
p(
  'Ihr liefert fast zu jeder Angabe eine Vorlage, die jemand Drittes unterschreiben muss. Das ist kein «Upload in 3 Minuten». Das ist ein Vorgang über Tage. Wenn der Magic Link nach 24 Stunden tot ist oder jemand nicht sieht, was noch fehlt, ist die Conversion bei null — egal wie gut die Landing ist.'
)
b('Ein Login-Weg: gleiche E-Mail, neuer Link, jederzeit, über mindestens 2–3 Wochen.')
b('Pro gewähltes Modul: Vorlage laden → ausfüllen lassen → hochladen → Status (offen / hochgeladen / Prüfung / verifiziert / nachreichen).')
b('Nur gewählte Module zeigen. Weggelassene nicht als Schuldgefühl nachverkaufen in derselben Session — später «erweitern» reicht.')
b('PDF-Download für den Vermieter grau, bis alle gewählten verifiziert sind. Der Nutzer sieht intern den Fortschritt.')
b('Mails: «Dein Link zurück ins Dossier» und «noch offen: Arbeitgeberbestätigung» — nicht «noch ein Modul kaufen».')

h('2. Preishebel (wenn nicht mehr CHF 0)')
p(
  'Weglassen darf den Preis ändern — das ist eure Regel. Dann muss der Builder das zeigen, sonst ist Abwählen sinnlos und wirkt nach kaputtem Shop. Heute ist alles kostenlos: da gibt es nichts zu «beeinflussen». Die UI darf das nicht mit Durchstreichen vortäuschen (das tut die Live-Seite schon richtig, solange Ersparnis 0 ist).'
)
b('Komplett vorausgewählt = Standard und, wenn das Bundle günstiger ist, der bessere Deal.')
b('Abwahl: Preis live, plus Satz «Auf dem Zertifikat fehlt dann: …».')
b('Kein Sterne-Kauf («kauf 4 für Gold»). Das wäre unehrlich neben eurer Vorlage-Prüfung.')

h('3. Copy, die ihr überzieht — und die Conversion schadet')
p(
  '«Kann er die Miete tragen?» und «Darf er hier wohnen?» klingen nach Garantie. Ihr prüft Belege auf Vollständigkeit und Plausibilität. Vermieter, die das PDF ernst nehmen, merken den Unterschied. Lieber: belegtes Einkommen; Ausweis/Bewilligung liegt vor. Weniger Drama, mehr Vertrauen — das ist Conversion bei 40- und 60-Jährigen.'
)

h('4. Was ich nicht anfassen würde')
b('Du-Form, keine Wohnungszusage, Urkunde im Hero, 5-vs-1, Default alle vier.')
b('Kein Sterne-Score. Kein unvollständiges Zertifikat an den Vermieter.')
b('Landing nicht auf eine einzige CTA-Zeile ohne Builder zusammenschneiden — ihr braucht die Wahl für den Preis.')

h('Reihenfolge, wenn ihr Zeit habt')
b('Zuerst Dossier: Vorlagen, Upload, Status, Link über Wochen, PDF erst wenn fertig.')
b('Dann Landing nur schärfen: ehrliche Vermieterfragen, weniger Wiederholung, ein «kostenlos».')
b('Dann Preise sichtbar machen, sobald sie nicht mehr 0 sind.')
b('Prüfseite QR: 10 Sekunden, kein Login, nur gewählte verifizierte Zeilen.')

box(
  'Mitnehmen',
  'Der heutige Aufbau der Startseite ist nicht das Problem, das eine neue «erste Idee» lösen muss — er ist schon nah an dem, was ihr braucht. Besser wird SIC, wenn der Mensch zwei Wochen lang weiss, wo seine Vorlagen liegen, und erst dann ein fertiges Dokument in der Hand hat. Alles, was wie ein neuer Shop aussieht, ohne dieses Dossier, ist Beschäftigung, keine Conversion.'
)

const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
  doc.text('Swiss Immo Cert  ·  internes Briefing  ·  kritisch', L, 812, { width: PW - 40 })
  doc.text(`${i - range.start + 1} / ${range.count}`, L, 812, { width: PW, align: 'right' })
}

doc.end()
await new Promise((res, rej) => {
  stream.on('finish', res)
  stream.on('error', rej)
})
console.log(out)
