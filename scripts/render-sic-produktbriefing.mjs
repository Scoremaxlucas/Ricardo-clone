/**
 * Einmal-Skript: SIC-Produktbriefing als PDF (kein Produktcode).
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
  margins: { top: 56, bottom: 60, left: 52, right: 52 },
  bufferPages: true,
  info: {
    Title: 'Swiss Immo Cert — Produktbriefing',
    Author: 'Produkt',
    Subject: 'Conversion, Message, Journey',
  },
})

const stream = fs.createWriteStream(out)
doc.pipe(stream)

const left = 52
const contentW = () => doc.page.width - 104
const bottom = () => doc.page.height - 60

function bar() {
  doc.save()
  doc.rect(0, 0, doc.page.width, 7).fill(NAVY)
  doc.rect(0, 7, doc.page.width, 2).fill(GOLD)
  doc.restore()
}

function ensure(h) {
  if (doc.y + h > bottom()) {
    doc.addPage()
    bar()
    doc.y = 28
  }
}

function kicker(t) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD).text(t.toUpperCase(), left, doc.y, {
    width: contentW(),
    characterSpacing: 1.2,
  })
  doc.moveDown(0.4)
}

function h1(t) {
  doc.font('Helvetica-Bold').fontSize(21).fillColor(NAVY).text(t, left, doc.y, { width: contentW(), lineGap: 2 })
  doc.moveDown(0.4)
}

function h2(t) {
  ensure(36)
  doc.moveDown(0.25)
  doc.font('Helvetica-Bold').fontSize(12.5).fillColor(NAVY).text(t, left, doc.y, { width: contentW() })
  doc.moveDown(0.25)
}

function para(t) {
  ensure(40)
  doc.font('Helvetica').fontSize(10).fillColor(INK).text(t, left, doc.y, {
    width: contentW(),
    lineGap: 3,
    align: 'justify',
  })
  doc.moveDown(0.4)
}

function bullet(t) {
  ensure(28)
  const y = doc.y
  doc.circle(left + 3, y + 5, 1.5).fill(GOLD)
  doc.font('Helvetica').fontSize(10).fillColor(INK).text(t, left + 12, y, { width: contentW() - 12, lineGap: 2 })
  doc.moveDown(0.2)
}

function callout(title, lines) {
  const pad = 11
  doc.font('Helvetica').fontSize(9)
  let inner = 20
  for (const line of lines) {
    inner += doc.heightOfString(line, { width: contentW() - pad * 2, lineGap: 2 }) + 3
  }
  ensure(inner + 8)
  const y = doc.y
  const h = inner + 8
  doc.save()
  doc.roundedRect(left, y, contentW(), h, 4).fill(PAPER)
  doc.roundedRect(left, y, contentW(), h, 4).lineWidth(0.7).strokeColor(GOLD).stroke()
  doc.restore()
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text(title, left + pad, y + 9, { width: contentW() - pad * 2 })
  let ty = y + 24
  for (const line of lines) {
    doc.font('Helvetica').fontSize(9).fillColor(INK).text(line, left + pad, ty, {
      width: contentW() - pad * 2,
      lineGap: 2,
    })
    ty = doc.y + 3
  }
  doc.y = y + h + 12
}

function goldRule() {
  const y = doc.y
  doc.save()
  doc.moveTo(left, y).lineTo(left + 64, y).lineWidth(1.4).strokeColor(GOLD).stroke()
  doc.restore()
  doc.y = y + 12
}

function flow(items, lastNavy) {
  const n = items.length
  const gap = 8
  const w = (contentW() - gap * (n - 1)) / n
  ensure(58)
  const y = doc.y
  const h = 50
  items.forEach((label, i) => {
    const x = left + i * (w + gap)
    const last = lastNavy && i === n - 1
    doc.save()
    doc.roundedRect(x, y, w, h, 3).fill(last ? NAVY : WHITE)
    doc.roundedRect(x, y, w, h, 3).lineWidth(0.7).strokeColor(NAVY).stroke()
    doc.font('Helvetica-Bold').fontSize(7).fillColor(last ? WHITE : NAVY)
    doc.text(label, x + 4, y + 10, { width: w - 8, align: 'center', lineGap: 1 })
    doc.restore()
  })
  doc.y = y + h + 12
}

function fourCols(cells) {
  const gap = 7
  const w = (contentW() - gap * 3) / 4
  const h = 92
  ensure(h + 8)
  const y = doc.y
  cells.forEach(([q, a], i) => {
    const x = left + i * (w + gap)
    doc.save()
    doc.roundedRect(x, y, w, h, 3).lineWidth(0.6).strokeColor(NAVY).stroke()
    doc.rect(x, y, w, 3.5).fill(GOLD)
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(GOLD).text('FRAGE', x + 5, y + 9, { width: w - 10 })
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY).text(q, x + 5, y + 20, { width: w - 10, lineGap: 1 })
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(a, x + 5, y + 48, { width: w - 10, lineGap: 1.2 })
    doc.restore()
  })
  doc.y = y + h + 12
}

// COVER
bar()
doc.y = 72
kicker('Internes Briefing  ·  nicht die öffentliche Website')
h1('Swiss Immo Cert')
doc.font('Helvetica').fontSize(13).fillColor(NAVY).text('Ein Dokument. Kein Baukasten.', left, doc.y, {
  width: contentW(),
})
doc.moveDown(0.55)
goldRule()
para(
  'Dieses Papier fasst die Produkt- und Conversion-Empfehlung zusammen: was heute schief läuft, welche Schnitte nötig sind, und wie Startseite, Dossier, PDF und Prüfseite zusammenhängen. Es ist keine Ticketliste. Es ist die Entscheidung, SIC als ernstes Schweizer Dokument zu verkaufen — nicht als Konfigurator.'
)
callout('Lesart', [
  'Für Gründer und Partner. Nach aussen bleibt das Du; hier ist der Text direkt.',
  'Zielmetrik: nicht Klicks auf «Kostenlos starten», sondern Stunden bis zum ersten Upload und Tage bis zum PDF mit QR.',
  'Unverändert: Du-Form, keine Wohnungszusage, keine erfundenen Zahlen, keine Sterne, keine Anrufe bei Dritten.',
])

h2('Das Problem in einem Bild')
para(
  'Heute muss jemand, der eine Wohnung will, zuerst ein Produkt zusammenbauen. Der Vermieter will nur eines: Unterlagen, die er in Sekunden versteht. Alles zwischen diesen zwei Sätzen ist Reibung — und Reibung ist verlorene Bewerbung.'
)
doc.font('Helvetica-Bold').fontSize(8).fillColor(RED).text('HEUTE — zu viele Entscheide vor dem Nutzen', left, doc.y)
doc.moveDown(0.3)
flow(['Schmerz', '4 Module', 'Paket', 'E-Mail', 'Link', 'Leeres Dossier', 'Später PDF'], false)

doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY).text('ZIEL — Zusage an das Blatt, dann Belege', left, doc.y)
doc.moveDown(0.3)
flow(['Schmerz + Urkunde', 'E-Mail', 'Sofort Upload', 'Lücken sichtbar', 'QR-PDF'], true)

para(
  'Die Module sind intern richtig: Prüfung, Zeilen auf dem PDF, später der Preis. Auf der Startseite sind sie ein Abbruch. Jede Abwahl sagt «mach es später». In diesem Markt kommt später nicht.'
)

// 1
doc.addPage()
bar()
doc.y = 28
kicker('Schnitt 1')
h1('Ein Zertifikat auf der Startseite')
para(
  'Für Neukunden gibt es ein Angebot: das vollständige Mieter-Zertifikat. Alle vier Angaben sind enthalten. Kein Abwählen, kein Warenkorb, kein «Beliebteste Wahl». Der Knopf ist eine Handlung, keine Konfiguration: Zertifikat anlegen — E-Mail reicht.'
)
h2('Was die Startseite dann trägt')
bullet('Hero: Schmerz in einem Satz, Lösung in einem Satz, eine Urkunde, ein Knopf.')
bullet('Darunter: die vier Vermieterfragen als Erklärung, was auf dem Dokument steht — nicht als Shop.')
bullet('Ein Satz zur Prüfung: innert 24 Stunden, Vollständigkeit und Plausibilität, kein Anruf.')
bullet('Ein Satz zum Preis in der Einführung — einmal, nicht achtmal «kostenlos».')
bullet('Kein zweiter Konfigurator, keine doppelte Urkunde, keine Rabattleiste bei null Franken.')
h2('Wo die Module leben')
para(
  'Im Dossier, nach dem Commitment. Dort sind sie eine Checkliste mit Fortschritt 1 von 4 bis 4 von 4. Fortschritt heisst: welche Vermieterfrage ist belegt — nicht «Stärke». Einzelne Angaben nachreichen nur, wer schon ein Zertifikat hat.'
)
callout('Warum das Conversion hebt', [
  'Eine Entscheidung statt vier. Weniger «ich überleg noch, welches Paket».',
  'Das versprochene PDF ist immer dasselbe Produkt, das ihr später verkauft.',
  'Vollständigkeit wird dort erarbeitet, wo der Nutzen schon begonnen hat: Konto, erstes File.',
])
h2('Skizze — was man sieht')
callout('Above the fold', [
  'Links: «Du schickst die Unterlagen. Es kommt keine Antwort.» Darunter: ein PDF, vier Angaben, QR. Knopf: Zertifikat anlegen.',
  'Rechts: die Beispiel-Urkunde. Unterzeile: Er scannt den QR.',
  'Kein Modul-Raster in diesem Bildschirm.',
])
callout('Direkt darunter', [
  'Vier kleine Felder in einer Reihe: Betreibungen · Einkommen · bisheriges Wohnen · Ausweis — Inhalt des Blatts, nicht Add-to-cart.',
  'Dann vier Schritte zum PDF: E-Mail, Upload, Prüfung, Download — ohne Bezahltheater.',
])

// 2
doc.addPage()
bar()
doc.y = 28
kicker('Schnitt 2')
h1('Eine Message, ehrliche Fragen')
para(
  'Der Ton bleibt Du, Mitte der Bevölkerung, nicht Strasse und nicht Behörde. Seriosität kommt aus dem Dokument und aus Sätzen, die ein Vermieter unterschreiben könnte — nicht aus Dichte, Goldleisten und Wiederholung.'
)
h2('Der Atemzug')
callout('Sinn, nicht Slogan-Tattoo', [
  'Ein PDF. Vier Angaben, die jeder Vermieter ohnehin will. QR zum Prüfen.',
  'Keine Wohnungszusage — eine Bewerbung, die man in Sekunden liest.',
])
h2('Was die vier Zeilen wirklich sagen dürfen')
fourCols([
  ['Betreibungen?', 'Auszug liegt geprüft vor. Nicht: schuldenfrei garantiert.'],
  ['Einkommen?', 'Belegtes Einkommen und Anstellung. Nicht: kann DIESE Miete tragen.'],
  ['Als Mieter?', 'Referenz des bisherigen Vermieters. Nicht: Charakter-Note.'],
  ['Ausweis?', 'Identität oder Bewilligung belegt. Nicht: darf in dieser Wohnung leben.'],
])
para(
  'Die schärferen Sprüche klingen nach Conversion und sind fachlich zu weit. «Kann er die Miete tragen?» prüft ihr nicht für ein konkretes Objekt. «Darf er hier wohnen?» ist keine Rechtsauskunft. Conversion aus Ehrlichkeit ist im Satz langsamer und im Geschäft haltbarer.'
)
h2('«Verifiziert»')
para(
  'Das ist ein Schweizer Qualitätsmerkmal, kein Kleingedrucktes unter dem Knopf: Wir prüfen, ob der Beleg vollständig und plausibel ist. Wir rufen niemanden an. Nach der Freigabe steht die Zeile auf dem Zertifikat. Wer Auskunft beim Arbeitgeber will, muss ein anderes Produkt bauen — und es dann liefern.'
)
h2('Was wegkann')
bullet('Lange Wiederholung des Schmerzes. Zwei Sätze reichen, dann das Dokument.')
bullet('«Kostenlos» als Leitmotiv. Einmal: derzeit ohne Gebühr, Prüfung innert 24 Stunden.')
bullet('Sterne, Scores, «starkes Zertifikat». Vollständig oder noch offen reicht.')
bullet('Anglizismen (Landingpage) und Slang. Dokument statt Blatt, wo es seriöser sitzt.')

// 3
doc.addPage()
bar()
doc.y = 28
kicker('Schnitt 3')
h1('Time-to-PDF ist das Produkt')
para(
  'Wer nach der E-Mail in ein leeres Dossier mit vier Formularen fällt, ist noch nicht Kunde. Er ist in einem zweiten Onboarding. Zählen soll: Zeit bis zum ersten Upload, Zeit bis zur ersten verifizierten Zeile, Zeit bis zum PDF mit QR — auch wenn noch Lücken draufstehen.'
)
h2('Reihenfolge, die zur Schweiz passt')
bullet('Sofort: Betreibungsauszug. Den hat fast jeder oder holt ihn schnell. Geringste Erklärlast.')
bullet('Dann: Ausweis oder Bewilligung. Ein Foto reicht oft.')
bullet('Dann: Lohnbeleg. Die Arbeitgeberbestätigung parallel per Link («Bitte unterschreiben»).')
bullet('Zuletzt: Vermieterreferenz — oft der langsamste Dritte. Das Zertifikat darf vorher existieren.')
h2('Unvollständig ist ein Feature')
para(
  'Ein Blatt mit zwei verifizierten Zeilen und zwei klaren «noch offen» schlägt fünf ungeöffnete Mail-Anhänge. Der Suchende hat etwas zum Beilegen. Der Vermieter sieht, was schon geprüft ist. Vollständig wird belohnt (alle vier Fragen zu), nicht erzwungen, bevor irgendein Nutzen da ist.'
)
callout('Dossier — Checkliste, kein Shop', [
  'Vier Zeilen: Frage · Status (offen / in Prüfung / verifiziert) · was hochladen.',
  'Ein Balken 1–4, derselbe Sinn wie früher auf der Startseite — nur hier, wo er Handlung steuert.',
  'Formulare zum Weiterleiten: eine Seite, Name vorausgefüllt, Link oder PDF.',
])
h2('Die 24 Stunden')
para(
  'Warten ist akzeptabel, wenn klar ist, dass etwas unterwegs ist. Stille nach dem Upload tötet. Eine Mail: wir haben den Auszug, Prüfung bis dann. Eine Mail bei Freigabe: die Zeile steht, PDF aktualisiert, QR unverändert gültig.'
)

// 4
doc.addPage()
bar()
doc.y = 28
kicker('Schnitt 4')
h1('Der Vermieter entscheidet über eure Conversion')
para(
  'Der Suchende legt ein Zertifikat an, wenn er glaubt, der Empfänger nehme es ernst. Ohne das ist SIC ein File für die Schublade. Portale gewinnen Sichtbarkeit. Ihr gewinnt, wenn dasselbe PDF an jeder Bewerbung hängt und der QR beim ersten Scan hält, was das Blatt verspricht.'
)
h2('Prüfseite in zehn Sekunden')
bullet('Kein Login, kein Konto, kein Jargon.')
bullet('Sichtbar: Name, Code, Stand (gültig oder abgelaufen), die Zeilen verifiziert oder offen.')
bullet('Ein Satz: Swiss Immo Cert hat die Belege auf Vollständigkeit und Plausibilität geprüft. Kein Anruf bei Dritten.')
bullet('Lesbar für 55+: Schrift, Kontrast, der QR auf dem Papier zeigt auf genau diese eine Adresse.')
h2('Das PDF als Vertrieb')
para(
  'Jedes beigelegte Zertifikat ist ein Aussendienstbesuch. Deshalb Urkunde: Navy, Gold, Siegel, wenig Text — nicht SaaS-Export. Die vier Zeilen sind der Inhalt. Der QR beweist, dass die Datei nicht zusammenkopiert wurde.'
)
callout('Kalter Markt', [
  'Zum Start braucht ihr keine zehntausend Vermieter-Konten.',
  'Ihr braucht Suchende, die das PDF wirklich mitschicken — und eine Prüfseite, die beim ersten Scan nicht peinlich ist.',
  'Später optional: ein Satz zum Kopieren in die Bewerbungsmail («So prüfen Sie dieses Zertifikat»).',
])

// 5
doc.addPage()
bar()
doc.y = 28
kicker('Schnitt 5')
h1('Plattform, Preis, Reihenfolge')
para(
  'SIC ist nicht der Marktplatz und nicht Helvenda Wohnen. Eine Domain, ein Versprechen, ein Zugang über E-Mail-Link. Wer zurückkommt, landet im Dossier, nicht im Konfigurator. Im Kopfzeile: Zertifikat anlegen oder Mein Bereich — nicht beides gleich laut, als gäbe es zwei Produkte.'
)
h2('Kostenlos jetzt, bezahlbar ohne Gesichtswechsel')
para(
  'Ohne Gebühr ist für den Cold Start richtig. Die Geschichte auf der Seite muss trotzdem schon die bezahlte sein: Prüfung, Standard, QR — nicht Gratis-Tool. Wenn der Preis kommt, verkauft ihr dasselbe vollständige Zertifikat, nicht vier Artikelnummern. Nachreichen einzelner Angaben kann extra kosten; der Einstieg bleibt ein Produkt.'
)
callout('Wenn Preise wieder da sind (Orientierung, nicht Tarifblatt)', [
  'Ein Preis für das vollständige Zertifikat — die alte Bundle-Idee, ohne Abwahl-Shop.',
  'Durchgestrichener Preis nur, wenn einzeln wirklich teurer wäre.',
  'Express (schnellere Prüfung) ist ein ehrlicher Aufpreis. Module auf der Startseite abwählen bleibt tot.',
])
h2('Was wir nicht anfassen')
bullet('Keine Wohnungszusage, keine Erfolgsquote, die ihr nicht messen könnt.')
bullet('Kein Scraping der grossen Portale.')
bullet('Kein Sterne-Score, kein Balken «Stärke 73».')
bullet('Keine heimliche Arbeitgeber-Hotline, die der Text nicht deckt.')
h2('Wenn ihr umsetzt — in dieser Reihenfolge')
bullet('1. Landing: ein Produkt, ein Knopf, vier Fragen nur als Inhalt, Schmerz kürzen.')
bullet('2. Dossier: Checkliste, erster Upload sofort (Betreibung), unvollständiges PDF erlauben.')
bullet('3. Prüfseite und PDF: zehn Sekunden Verstehen, ehrliche Zeilen.')
bullet('4. Mails an den Status. Erst dann: Bezahlpreis und Express.')

doc.moveDown(0.35)
goldRule()
doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('Satz zum Mitnehmen', left, doc.y)
doc.moveDown(0.35)
para(
  'Wer sucht, darf auf der Startseite nur verstehen: ein ernstes Schweizer PDF statt fünf Anhängen — jetzt anlegen. Wer prüft, darf nur verstehen: QR, Stand, vier klare Zeilen. Alles, was dazwischen Konfigurator, Rabatt und Modulphilosophie ist, gehört hinter den ersten Klick — oder ganz weg.'
)

const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  doc.text('Swiss Immo Cert  ·  internes Briefing  ·  August 2026', left, doc.page.height - 36, {
    width: contentW() - 40,
    align: 'left',
  })
  doc.text(`${i - range.start + 1} / ${range.count}`, left, doc.page.height - 36, {
    width: contentW(),
    align: 'right',
  })
}

doc.end()
await new Promise((res, rej) => {
  stream.on('finish', res)
  stream.on('error', rej)
})
console.log(out)
