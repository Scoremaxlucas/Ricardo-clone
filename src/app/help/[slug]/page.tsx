'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, BookOpen, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Article {
  slug: string
  title: string
  category: string
  content: string[]
  tips?: string[]
  warnings?: string[]
}

const articles: Record<string, Article> = {
  'create-account': {
    slug: 'create-account',
    title: 'Wie erstelle ich ein Konto?',
    category: 'Konto & Profil',
    content: [
      'Die Registrierung bei Helvenda ist kostenlos und dauert nur wenige Minuten.',
      'Klicken Sie auf "Anmelden" in der oberen rechten Ecke der Website.',
      'Wählen Sie "Registrieren" aus.',
      'Geben Sie Ihre E-Mail-Adresse und ein sicheres Passwort ein.',
      'Bestätigen Sie Ihre E-Mail-Adresse durch Klick auf den Link in der Bestätigungs-E-Mail.',
      'Ihr Konto ist jetzt aktiviert und Sie können sofort Artikel kaufen und verkaufen.',
    ],
    tips: [
      'Verwenden Sie ein sicheres Passwort mit mindestens 8 Zeichen.',
      'Prüfen Sie auch Ihren Spam-Ordner, falls die Bestätigungs-E-Mail nicht ankommt.',
    ],
  },
  'verify-account': {
    slug: 'verify-account',
    title: 'Wie verifiziere ich mein Konto?',
    category: 'Konto & Profil',
    content: [
      'Ein verifiziertes Konto erhöht das Vertrauen bei anderen Nutzern.',
      'Gehen Sie zu Ihrem Profil und klicken Sie auf "Konto verifizieren".',
      'Laden Sie ein gültiges Ausweisdokument hoch (ID, Pass oder Führerschein).',
      'Warten Sie auf die Überprüfung durch unser Team (normalerweise 1-2 Werktage).',
      'Sobald Ihr Konto verifiziert ist, erhalten Sie ein Verifizierungs-Badge.',
    ],
    tips: [
      'Stellen Sie sicher, dass das Dokument gut lesbar ist.',
      'Das Dokument muss noch gültig sein.',
    ],
  },
  'edit-profile': {
    slug: 'edit-profile',
    title: 'Wie bearbeite ich mein Profil?',
    category: 'Konto & Profil',
    content: [
      'Klicken Sie auf Ihr Profilbild in der oberen rechten Ecke.',
      'Wählen Sie "Mein Profil" aus.',
      'Klicken Sie auf "Bearbeiten" oder direkt auf die Felder, die Sie ändern möchten.',
      'Sie können folgende Informationen bearbeiten:',
      '  • Name und Anzeigename',
      '  • Profilbild',
      '  • Adresse (Strasse, Hausnummer, PLZ, Ort, Land)',
      '  • Telefonnummer',
      '  • Zahlungsmethoden',
      'Speichern Sie Ihre Änderungen.',
    ],
  },
  'change-password': {
    slug: 'change-password',
    title: 'Wie ändere ich mein Passwort?',
    category: 'Konto & Profil',
    content: [
      'Gehen Sie zu Ihrem Profil.',
      'Klicken Sie auf "Einstellungen" oder "Passwort ändern".',
      'Geben Sie Ihr aktuelles Passwort ein.',
      'Geben Sie Ihr neues Passwort ein (mindestens 8 Zeichen).',
      'Bestätigen Sie Ihr neues Passwort.',
      'Klicken Sie auf "Passwort ändern".',
    ],
    tips: [
      'Verwenden Sie ein starkes Passwort mit Buchstaben, Zahlen und Sonderzeichen.',
      'Teilen Sie Ihr Passwort niemals mit anderen.',
    ],
  },
  'how-to-buy': {
    slug: 'how-to-buy',
    title: 'Wie kaufe ich einen Artikel?',
    category: 'Kaufen',
    content: [
      'Durchsuchen Sie die Artikel auf Helvenda oder verwenden Sie die Suchfunktion.',
      'Klicken Sie auf einen Artikel, der Sie interessiert.',
      'Sie haben zwei Optionen:',
      '  • Sofortkauf: Klicken Sie auf "Jetzt kaufen" für den Sofortpreis',
      '  • Auktion: Geben Sie ein Gebot ab oder nutzen Sie den Sofortpreis',
      'Nach dem Kauf erhalten Sie die Kontaktdaten des Verkäufers.',
      'Sie haben 7 Tage Zeit, um Kontakt aufzunehmen und die Zahlung zu arrangieren.',
      'Der Verkäufer versendet den Artikel nach Zahlungseingang.',
    ],
    tips: [
      'Lesen Sie die Artikelbeschreibung genau durch.',
      'Prüfen Sie das Profil des Verkäufers und dessen Bewertungen.',
      'Stellen Sie Fragen vor dem Kauf, falls etwas unklar ist.',
    ],
  },
  'auctions': {
    slug: 'auctions',
    title: 'Wie funktionieren Auktionen?',
    category: 'Kaufen',
    content: [
      'Bei einer Auktion können Sie auf einen Artikel bieten.',
      'Das höchste Gebot gewinnt, wenn die Auktion endet.',
      'Sie können auch einen Sofortpreis anbieten, um die Auktion sofort zu gewinnen.',
      'Gebote müssen mindestens den Mindestbetrag erreichen (meist CHF 1.- mehr als das aktuelle Höchstgebot).',
      'Wenn Sie überboten werden, erhalten Sie eine Benachrichtigung.',
      'Wenn die Auktion endet und Sie das höchste Gebot haben, wird automatisch ein Kauf erstellt.',
      'Sie erhalten dann die Kontaktdaten des Verkäufers.',
    ],
    tips: [
      'Setzen Sie sich ein Budget und bleiben Sie dabei.',
      'Beobachten Sie die Auktion, um rechtzeitig zu reagieren.',
      'Nutzen Sie die "Beobachten"-Funktion, um über Änderungen informiert zu werden.',
    ],
  },
  'price-offers': {
    slug: 'price-offers',
    title: 'Wie mache ich einen Preisvorschlag?',
    category: 'Kaufen',
    content: [
      'Preisvorschläge sind nur bei Artikeln mit Sofortkauf-Option möglich (nicht bei Auktionen).',
      'Klicken Sie auf "Preisvorschlag" auf der Artikelseite.',
      'Geben Sie Ihren gewünschten Preis ein (mindestens 60% des Verkaufspreises).',
      'Optional: Fügen Sie eine Nachricht hinzu.',
      'Der Verkäufer erhält eine Benachrichtigung über Ihren Preisvorschlag.',
      'Der Verkäufer kann Ihren Vorschlag annehmen, ablehnen oder einen Gegenangebot machen.',
      'Sie erhalten eine Benachrichtigung über die Entscheidung.',
    ],
    tips: [
      'Machen Sie realistische Angebote.',
      'Sie können bis zu 3 aktive Preisvorschläge pro Artikel haben.',
      'Preisvorschläge laufen nach 48 Stunden ab, wenn keine Antwort kommt.',
    ],
  },
  'payment': {
    slug: 'payment',
    title: 'Wie bezahle ich?',
    category: 'Kaufen',
    content: [
      'Nach dem Kauf erhalten Sie die Zahlungsinformationen des Verkäufers.',
      'Helvenda unterstützt folgende Zahlungsmethoden:',
      '  • Banküberweisung (mit QR-Code für einfache Überweisung)',
      '  • TWINT (schnell und sicher)',
      '  • Kreditkarte (Visa, Mastercard)',
      'Wählen Sie Ihre bevorzugte Zahlungsmethode.',
      'Folgen Sie den Anweisungen für die gewählte Zahlungsmethode.',
      'Bestätigen Sie die Zahlung im System, sobald Sie bezahlt haben.',
    ],
    tips: [
      'Bewahren Sie Zahlungsbelege auf.',
      'Zahlen Sie nur über die offiziellen Zahlungsmethoden von Helvenda.',
      'Zahlen Sie niemals außerhalb der Plattform.',
    ],
    warnings: [
      'Vorsicht vor Betrügern, die Sie auffordern, außerhalb der Plattform zu zahlen.',
    ],
  },
  'tracking': {
    slug: 'tracking',
    title: 'Wie verfolge ich meine Bestellung?',
    category: 'Kaufen',
    content: [
      'Nach dem Versand erhalten Sie eine Tracking-Nummer vom Verkäufer.',
      'Gehen Sie zu "Mein Kaufen" > "Gekauft".',
      'Klicken Sie auf den gekauften Artikel.',
      'Die Tracking-Nummer wird dort angezeigt.',
      'Klicken Sie auf die Tracking-Nummer, um die Sendung online zu verfolgen.',
      'Sie können auch direkt auf der Website des Versanddienstleisters nach der Nummer suchen.',
    ],
    tips: [
      'Bewahren Sie die Tracking-Nummer auf.',
      'Prüfen Sie regelmäßig den Status Ihrer Sendung.',
    ],
  },
  'how-to-sell': {
    slug: 'how-to-sell',
    title: 'Wie verkaufe ich einen Artikel?',
    category: 'Verkaufen',
    content: [
      'Klicken Sie auf "+ Verkaufen" in der oberen Navigation.',
      'Wählen Sie die Kategorie Ihres Artikels aus.',
      'Füllen Sie alle Pflichtfelder aus:',
      '  • Titel und Beschreibung',
      '  • Marke und Modell',
      '  • Zustand',
      '  • Preis oder Auktionsstartpreis',
      'Laden Sie mindestens ein Foto hoch (mehr ist besser).',
      'Wählen Sie Versandoptionen (Abholung, A-Post, B-Post).',
      'Optional: Wählen Sie Booster für mehr Sichtbarkeit.',
      'Klicken Sie auf "Angebot erstellen".',
      'Ihr Artikel ist jetzt online und sichtbar für Käufer.',
    ],
    tips: [
      'Verwenden Sie gute, klare Fotos von allen Seiten.',
      'Beschreiben Sie den Artikel genau und ehrlich.',
      'Setzen Sie einen realistischen Preis.',
    ],
  },
  'create-listing': {
    slug: 'create-listing',
    title: 'Wie erstelle ich ein Angebot?',
    category: 'Verkaufen',
    content: [
      'Gehen Sie zu "+ Verkaufen" in der Navigation.',
      'Wählen Sie die passende Kategorie für Ihren Artikel.',
      'Füllen Sie das Formular aus:',
      '  • Titel: Kurz und prägnant',
      '  • Beschreibung: Detailliert mit allen wichtigen Informationen',
      '  • Marke und Modell',
      '  • Zustand (Neu, Sehr gut, Gut, etc.)',
      '  • Preis: Sofortpreis oder Auktionsstartpreis',
      'Laden Sie Fotos hoch (mindestens 1, empfohlen: 3-5).',
      'Wählen Sie Versandoptionen.',
      'Optional: Aktivieren Sie Booster für mehr Sichtbarkeit.',
      'Überprüfen Sie alle Angaben und klicken Sie auf "Angebot erstellen".',
    ],
    tips: [
      'Gute Fotos sind entscheidend für den Verkaufserfolg.',
      'Nutzen Sie natürliches Licht für die Fotos.',
      'Zeigen Sie eventuelle Mängel klar auf.',
    ],
  },
  'boosters': {
    slug: 'boosters',
    title: 'Was sind Booster?',
    category: 'Verkaufen',
    content: [
      'Booster machen Ihr Angebot sichtbarer und erhöhen die Chancen auf einen Verkauf.',
      'Es gibt drei Arten von Boostern:',
      '  • Boost: Standard-Boost für erhöhte Sichtbarkeit',
      '  • Turbo-Boost: Deutlich erhöhte Sichtbarkeit mit speziellen Features',
      '  • Super-Boost: Maximale Sichtbarkeit mit Premium-Platzierung',
      'Booster können beim Erstellen eines Angebots oder später aktiviert werden.',
      'Die Kosten für Booster werden nach erfolgreichem Verkauf in Rechnung gestellt.',
      'Booster laufen für die Dauer des Angebots oder bis zum Verkauf.',
    ],
    tips: [
      'Booster sind besonders sinnvoll für wertvolle Artikel.',
      'Sie können Booster jederzeit ändern oder entfernen.',
    ],
  },
  'fees': {
    slug: 'fees',
    title: 'Welche Gebühren fallen an?',
    category: 'Verkaufen',
    content: [
      'Die Registrierung und das Erstellen von Angeboten ist kostenlos.',
      'Gebühren fallen nur an, wenn Sie einen Artikel erfolgreich verkaufen.',
      'Die Verkaufsgebühr wird als Prozentsatz des Verkaufspreises berechnet.',
      'Die genauen Gebührensätze finden Sie in den AGB.',
      'Zusätzlich können Booster-Kosten anfallen, wenn Sie Booster aktiviert haben.',
      'Sie erhalten eine Rechnung nach dem Verkauf.',
      'Die Rechnung muss innerhalb der angegebenen Frist bezahlt werden.',
    ],
    tips: [
      'Die Gebühren werden transparent vor dem Verkauf angezeigt.',
      'Sie können Ihre Rechnungen unter "Gebühren & Rechnungen" einsehen.',
    ],
  },
  'shipping': {
    slug: 'shipping',
    title: 'Wie versende ich einen Artikel?',
    category: 'Verkaufen',
    content: [
      'Nach dem Verkauf erhalten Sie die Kontaktdaten des Käufers.',
      'Warten Sie auf die Zahlungsbestätigung, bevor Sie versenden.',
      'Packen Sie den Artikel sicher ein.',
      'Wählen Sie die Versandmethode, die Sie beim Erstellen des Angebots angegeben haben:',
      '  • Abholung: Vereinbaren Sie einen Termin mit dem Käufer',
      '  • A-Post: Schneller Versand (1-2 Werktage)',
      '  • B-Post: Standard-Versand (2-3 Werktage)',
      'Geben Sie die Tracking-Nummer im System ein, sobald Sie versendet haben.',
      'Der Käufer wird automatisch benachrichtigt.',
    ],
    tips: [
      'Verwenden Sie ausreichend Verpackungsmaterial.',
      'Für wertvolle Artikel empfiehlt sich eine Versicherung.',
      'Bewahren Sie den Versandbeleg auf.',
    ],
  },
  'payment-methods': {
    slug: 'payment-methods',
    title: 'Welche Zahlungsmethoden gibt es?',
    category: 'Zahlung & Gebühren',
    content: [
      'Helvenda unterstützt verschiedene sichere Zahlungsmethoden:',
      '  • Banküberweisung: Traditionelle Überweisung mit QR-Code für einfache Zahlung',
      '  • TWINT: Schnelle und sichere mobile Zahlung',
      '  • Kreditkarte: Visa und Mastercard werden akzeptiert',
      'Alle Zahlungen werden über sichere Zahlungsdienstleister abgewickelt.',
      'Wir speichern keine Kreditkartendaten.',
      'Wählen Sie beim Kauf Ihre bevorzugte Zahlungsmethode.',
    ],
    tips: [
      'TWINT ist besonders schnell und einfach.',
      'Banküberweisungen können 1-2 Werktage dauern.',
    ],
  },
  'seller-fees': {
    slug: 'seller-fees',
    title: 'Welche Gebühren zahle ich als Verkäufer?',
    category: 'Zahlung & Gebühren',
    content: [
      'Als Verkäufer zahlen Sie eine Verkaufsgebühr, die als Prozentsatz des Verkaufspreises berechnet wird.',
      'Die genauen Gebührensätze finden Sie in den AGB.',
      'Zusätzlich können Booster-Kosten anfallen, wenn Sie Booster aktiviert haben.',
      'Gebühren fallen nur bei erfolgreichem Verkauf an.',
      'Sie erhalten eine Rechnung nach dem Verkauf.',
      'Die Rechnung muss innerhalb der angegebenen Frist bezahlt werden.',
      'Sie können Ihre Rechnungen unter "Gebühren & Rechnungen" einsehen und bezahlen.',
    ],
  },
  'invoice': {
    slug: 'invoice',
    title: 'Wie erhalte ich eine Rechnung?',
    category: 'Zahlung & Gebühren',
    content: [
      'Nach einem erfolgreichen Verkauf erhalten Sie automatisch eine Rechnung.',
      'Die Rechnung wird in Ihrem Konto unter "Gebühren & Rechnungen" angezeigt.',
      'Sie erhalten auch eine E-Mail-Benachrichtigung mit der Rechnung.',
      'Die Rechnung enthält:',
      '  • Rechnungsnummer',
      '  • Verkaufsdetails',
      '  • Gebührenaufstellung',
      '  • Zahlungsinformationen',
      'Sie können die Rechnung als PDF herunterladen.',
      'Die Rechnung kann per Banküberweisung, TWINT oder Kreditkarte bezahlt werden.',
    ],
  },
  'refund': {
    slug: 'refund',
    title: 'Wie funktioniert eine Rückerstattung?',
    category: 'Zahlung & Gebühren',
    content: [
      'Rückerstattungen werden im Falle eines Disputes oder einer Stornierung verarbeitet.',
      'Wenn ein Kauf storniert wird, erhalten Sie automatisch eine Rückerstattung.',
      'Die Rückerstattung erfolgt auf das ursprüngliche Zahlungsmittel.',
      'Bei Banküberweisungen kann die Rückerstattung 3-5 Werktage dauern.',
      'Sie erhalten eine Bestätigung per E-Mail.',
      'Falls Sie Fragen zur Rückerstattung haben, kontaktieren Sie unseren Support.',
    ],
  },
  'safe-buying': {
    slug: 'safe-buying',
    title: 'Wie kaufe ich sicher?',
    category: 'Sicherheit',
    content: [
      'Prüfen Sie das Profil des Verkäufers:',
      '  • Verifizierung',
      '  • Bewertungen von anderen Käufern',
      '  • Anzahl der Verkäufe',
      'Lesen Sie die Artikelbeschreibung genau.',
      'Stellen Sie Fragen vor dem Kauf, falls etwas unklar ist.',
      'Zahlen Sie nur über die offiziellen Zahlungsmethoden von Helvenda.',
      'Zahlen Sie niemals außerhalb der Plattform.',
      'Bewahren Sie alle Kommunikationen und Zahlungsbelege auf.',
      'Melden Sie verdächtige Aktivitäten sofort.',
    ],
    warnings: [
      'Vorsicht vor Betrügern, die Sie auffordern, außerhalb der Plattform zu zahlen.',
      'Seien Sie misstrauisch bei ungewöhnlich günstigen Preisen.',
    ],
  },
  'safe-selling': {
    slug: 'safe-selling',
    title: 'Wie verkaufe ich sicher?',
    category: 'Sicherheit',
    content: [
      'Beschreiben Sie Ihren Artikel genau und ehrlich.',
      'Verwenden Sie gute, klare Fotos.',
      'Warten Sie auf die Zahlungsbestätigung, bevor Sie versenden.',
      'Verwenden Sie versicherten Versand für wertvolle Artikel.',
      'Geben Sie die Tracking-Nummer im System ein.',
      'Kommunizieren Sie klar mit dem Käufer.',
      'Melden Sie verdächtige Aktivitäten sofort.',
    ],
    tips: [
      'Ein verifiziertes Konto erhöht das Vertrauen bei Käufern.',
      'Gute Bewertungen helfen beim Verkauf.',
    ],
  },
  'disputes': {
    slug: 'disputes',
    title: 'Was ist ein Dispute?',
    category: 'Sicherheit',
    content: [
      'Ein Dispute ist eine Streitigkeit zwischen Käufer und Verkäufer.',
      'Nur der Verkäufer kann einen Dispute eröffnen.',
      'Gründe für einen Dispute können sein:',
      '  • Artikel entspricht nicht der Beschreibung',
      '  • Zahlungsprobleme',
      '  • Kommunikationsprobleme',
      'Ein Admin prüft den Fall und entscheidet über die Lösung.',
      'Mögliche Lösungen:',
      '  • Rückerstattung an den Käufer',
      '  • Verkauf wird bestätigt',
      '  • Artikel wird zurückgesendet',
      'Sie werden über die Entscheidung informiert.',
    ],
  },
  'scams': {
    slug: 'scams',
    title: 'Wie erkenne ich Betrug?',
    category: 'Sicherheit',
    content: [
      'Warnsignale für Betrug:',
      '  • Ungewöhnlich günstige Preise',
      '  • Verkäufer ohne Profilbild oder Verifizierung',
      '  • Aufforderung zur Zahlung außerhalb der Plattform',
      '  • Druck, schnell zu handeln',
      '  • Unklare oder fehlende Artikelbeschreibung',
      '  • Schlechte oder fehlende Bewertungen',
      'Was Sie tun sollten:',
      '  • Prüfen Sie das Profil des Verkäufers genau',
      '  • Stellen Sie Fragen',
      '  • Zahlen Sie nur über die offiziellen Zahlungsmethoden',
      '  • Melden Sie verdächtige Angebote',
    ],
    warnings: [
      'Wenn etwas zu gut klingt, um wahr zu sein, ist es wahrscheinlich Betrug.',
      'Zahlen Sie niemals außerhalb der Plattform.',
    ],
  },
  'shipping-options': {
    slug: 'shipping-options',
    title: 'Welche Versandoptionen gibt es?',
    category: 'Versand',
    content: [
      'Helvenda bietet verschiedene Versandoptionen:',
      '  • Abholung: Persönliche Übergabe zwischen Käufer und Verkäufer',
      '  • A-Post: Schneller Versand innerhalb der Schweiz (1-2 Werktage)',
      '  • B-Post: Standard-Versand innerhalb der Schweiz (2-3 Werktage)',
      'Die Versandkosten werden beim Erstellen des Angebots angezeigt.',
      'Der Käufer kann die Versandmethode beim Kauf wählen.',
      'Nach dem Versand erhalten Sie eine Tracking-Nummer.',
    ],
  },
  'shipping-costs': {
    slug: 'shipping-costs',
    title: 'Was kostet der Versand?',
    category: 'Versand',
    content: [
      'Die Versandkosten hängen von der gewählten Versandart und der Größe/Gewicht des Artikels ab.',
      'A-Post ist in der Regel teurer als B-Post, aber schneller.',
      'Abholung ist kostenlos.',
      'Die genauen Kosten werden beim Erstellen des Angebots angezeigt.',
      'Der Käufer zahlt die Versandkosten zusätzlich zum Kaufpreis.',
      'Für sehr große oder schwere Artikel können zusätzliche Kosten anfallen.',
    ],
  },
  'insurance': {
    slug: 'insurance',
    title: 'Ist der Versand versichert?',
    category: 'Versand',
    content: [
      'Standard-Versand ist nicht automatisch versichert.',
      'Für wertvolle Artikel können Sie eine zusätzliche Versicherung abschließen.',
      'Die Versicherungskosten werden zusätzlich zu den Versandkosten berechnet.',
      'Fragen Sie den Verkäufer nach den Versandoptionen und Versicherungsmöglichkeiten.',
      'Wir empfehlen eine Versicherung für Artikel über CHF 500.-',
    ],
    tips: [
      'Bewahren Sie Versandbelege auf.',
      'Fotografieren Sie wertvolle Artikel vor dem Versand.',
    ],
  },
}

export default function HelpArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const article = articles[slug]

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Artikel nicht gefunden</h2>
            <p className="text-gray-600 mb-6">Der gesuchte Hilfe-Artikel existiert nicht.</p>
            <Link
              href="/help"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Zurück zum Hilfe-Center
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Back Button */}
        <Link
          href="/help"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Zurück zum Hilfe-Center
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="text-sm text-gray-500 mb-2">{article.category}</div>
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <div className="space-y-4">
              {article.content.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tips */}
            {article.tips && article.tips.length > 0 && (
              <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Tipps:</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      {article.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {article.warnings && article.warnings.length > 0 && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Wichtig:</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800">
                      {article.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              War diese Antwort hilfreich? Falls nicht, können Sie uns gerne kontaktieren.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Kontakt aufnehmen
              </Link>
              <Link
                href="/faq"
                className="px-4 py-2 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm"
              >
                Weitere Fragen
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

