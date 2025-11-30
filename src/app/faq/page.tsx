'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

const faqCategories = [
  {
    id: 'general',
    title: 'Allgemein',
    questions: [
      {
        question: 'Was ist Helvenda?',
        answer: 'Helvenda ist der neue Schweizer Online-Marktplatz für alles. Hier können Sie Artikel kaufen und verkaufen - von Uhren über Elektronik bis hin zu Möbeln und mehr.'
      },
      {
        question: 'Ist Helvenda kostenlos?',
        answer: 'Die Registrierung und das Durchsuchen von Artikeln ist kostenlos. Als Verkäufer fallen Gebühren an, wenn Sie einen Artikel erfolgreich verkaufen. Die genauen Gebühren finden Sie in unseren AGB.'
      },
      {
        question: 'Wie erstelle ich ein Konto?',
        answer: 'Klicken Sie auf "Anmelden" und dann auf "Registrieren". Geben Sie Ihre E-Mail-Adresse und ein sicheres Passwort ein. Sie erhalten eine Bestätigungs-E-Mail, die Sie aktivieren müssen.'
      },
      {
        question: 'Wie verifiziere ich mein Konto?',
        answer: 'Nach der Registrierung können Sie Ihr Konto verifizieren, um mehr Vertrauen bei anderen Nutzern aufzubauen. Gehen Sie zu Ihrem Profil und folgen Sie den Anweisungen zur Verifizierung.'
      },
    ]
  },
  {
    id: 'buying',
    title: 'Kaufen',
    questions: [
      {
        question: 'Wie kaufe ich einen Artikel?',
        answer: 'Sie können Artikel entweder über eine Auktion ersteigern oder direkt zum Sofortpreis kaufen. Bei Auktionen geben Sie ein Gebot ab, beim Sofortkauf klicken Sie einfach auf "Jetzt kaufen".'
      },
      {
        question: 'Wie funktionieren Auktionen?',
        answer: 'Bei einer Auktion können Sie ein Gebot abgeben. Das höchste Gebot gewinnt, wenn die Auktion endet. Sie können auch einen Sofortpreis anbieten, um die Auktion sofort zu gewinnen.'
      },
      {
        question: 'Wie mache ich einen Preisvorschlag?',
        answer: 'Bei Artikeln mit Sofortkauf-Option können Sie dem Verkäufer einen Preisvorschlag machen. Der Verkäufer kann diesen annehmen, ablehnen oder einen Gegenangebot machen.'
      },
      {
        question: 'Wie bezahle ich?',
        answer: 'Nach dem Kauf können Sie per Banküberweisung (mit QR-Code), TWINT oder Kreditkarte bezahlen. Die Zahlungsdetails erhalten Sie nach dem Kauf.'
      },
      {
        question: 'Was passiert nach dem Kauf?',
        answer: 'Nach dem Kauf erhalten Sie die Kontaktdaten des Verkäufers. Sie haben 7 Tage Zeit, um Kontakt aufzunehmen und die Zahlung zu arrangieren. Der Verkäufer versendet den Artikel dann an Sie.'
      },
    ]
  },
  {
    id: 'selling',
    title: 'Verkaufen',
    questions: [
      {
        question: 'Wie verkaufe ich einen Artikel?',
        answer: 'Klicken Sie auf "+ Verkaufen" und erstellen Sie ein neues Angebot. Laden Sie Bilder hoch, geben Sie eine Beschreibung ein und wählen Sie zwischen Auktion oder Sofortkauf.'
      },
      {
        question: 'Was sind Booster?',
        answer: 'Booster machen Ihr Angebot sichtbarer. Es gibt drei Arten: Boost (Standard), Turbo-Boost (erhöhte Sichtbarkeit) und Super-Boost (maximale Sichtbarkeit).'
      },
      {
        question: 'Welche Gebühren fallen an?',
        answer: 'Als Verkäufer zahlen Sie eine Verkaufsgebühr, die als Prozentsatz des Verkaufspreises berechnet wird. Die genauen Gebühren finden Sie unter "Gebühren & Rechnungen" in Ihrem Profil.'
      },
      {
        question: 'Wie versende ich einen Artikel?',
        answer: 'Nach dem Verkauf erhalten Sie die Kontaktdaten des Käufers. Sie können den Artikel per Post versenden oder zur Abholung anbieten. Geben Sie die Versanddaten im System ein.'
      },
      {
        question: 'Wann erhalte ich mein Geld?',
        answer: 'Sobald der Käufer die Zahlung bestätigt hat und Sie den Erhalt bestätigt haben, wird das Geld auf Ihr Konto überwiesen. Die genaue Abwicklung hängt von der gewählten Zahlungsmethode ab.'
      },
    ]
  },
  {
    id: 'payment',
    title: 'Zahlung & Gebühren',
    questions: [
      {
        question: 'Welche Zahlungsmethoden gibt es?',
        answer: 'Sie können per Banküberweisung (mit QR-Code), TWINT oder Kreditkarte bezahlen. Alle Zahlungsmethoden sind sicher und verschlüsselt.'
      },
      {
        question: 'Wie sicher ist die Zahlung?',
        answer: 'Alle Zahlungen werden über sichere Zahlungsdienstleister abgewickelt. Wir speichern keine Kreditkartendaten. TWINT und Banküberweisungen sind besonders sicher.'
      },
      {
        question: 'Was kostet der Verkauf?',
        answer: 'Die Verkaufsgebühr wird als Prozentsatz des Verkaufspreises berechnet. Die genauen Gebühren finden Sie in den AGB und unter "Gebühren & Rechnungen" in Ihrem Profil.'
      },
      {
        question: 'Wann muss ich die Gebühren bezahlen?',
        answer: 'Die Gebühren werden nach erfolgreichem Verkauf in Rechnung gestellt. Sie erhalten eine Rechnung, die Sie innerhalb der Frist bezahlen müssen.'
      },
    ]
  },
  {
    id: 'safety',
    title: 'Sicherheit',
    questions: [
      {
        question: 'Wie kaufe ich sicher?',
        answer: 'Prüfen Sie das Profil des Verkäufers, lesen Sie die Artikelbeschreibung genau und stellen Sie Fragen vor dem Kauf. Nutzen Sie die sicheren Zahlungsmethoden und melden Sie verdächtige Aktivitäten.'
      },
      {
        question: 'Wie verkaufe ich sicher?',
        answer: 'Beschreiben Sie Ihren Artikel genau und verwenden Sie gute Fotos. Warten Sie auf die Zahlungsbestätigung, bevor Sie versenden. Nutzen Sie versicherten Versand für wertvolle Artikel.'
      },
      {
        question: 'Was ist ein Dispute?',
        answer: 'Ein Dispute ist eine Streitigkeit zwischen Käufer und Verkäufer. Nur der Verkäufer kann einen Dispute eröffnen. Ein Admin prüft den Fall und entscheidet über die Lösung.'
      },
      {
        question: 'Wie erkenne ich Betrug?',
        answer: 'Vorsicht bei ungewöhnlich günstigen Preisen, Verkäufern ohne Profilbild oder Verifizierung, und bei Aufforderungen zur Zahlung außerhalb der Plattform. Melden Sie verdächtige Angebote.'
      },
    ]
  },
  {
    id: 'shipping',
    title: 'Versand',
    questions: [
      {
        question: 'Welche Versandoptionen gibt es?',
        answer: 'Sie können zwischen Abholung, A-Post und B-Post wählen. Bei Abholung treffen sich Käufer und Verkäufer persönlich. A-Post ist schneller, B-Post günstiger.'
      },
      {
        question: 'Was kostet der Versand?',
        answer: 'Die Versandkosten hängen von der gewählten Versandart und der Größe/Gewicht des Artikels ab. Die genauen Kosten werden beim Erstellen des Angebots angezeigt.'
      },
      {
        question: 'Wie verfolge ich meine Sendung?',
        answer: 'Nach dem Versand erhalten Sie eine Tracking-Nummer, mit der Sie Ihre Sendung online verfolgen können. Geben Sie die Tracking-Nummer im System ein.'
      },
      {
        question: 'Ist der Versand versichert?',
        answer: 'Standard-Versand ist nicht automatisch versichert. Für wertvolle Artikel empfehlen wir eine zusätzliche Versicherung. Fragen Sie den Verkäufer nach den Versandoptionen.'
      },
    ]
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`
    const newOpen = new Set(openQuestions)
    if (newOpen.has(key)) {
      newOpen.delete(key)
    } else {
      newOpen.add(key)
    }
    setOpenQuestions(newOpen)
  }

  const filteredCategories = faqCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return category.title.toLowerCase().includes(query) ||
           category.questions.some(q => 
             q.question.toLowerCase().includes(query) || 
             q.answer.toLowerCase().includes(query)
           )
  })

  const filteredQuestions = filteredCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)
    })
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Häufig gestellte Fragen (FAQ)</h1>
          <p className="text-lg text-gray-600">
            Finden Sie schnell Antworten auf die häufigsten Fragen
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Fragen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Alle
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {filteredQuestions.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.title}</h2>
                <div className="space-y-4">
                  {category.questions.map((faq, index) => {
                    const key = `${category.id}-${index}`
                    const isOpen = openQuestions.has(key)
                    return (
                      <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(category.id, index)}
                          className="w-full flex items-center justify-between text-left py-2 hover:text-primary-600 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-3 text-gray-600 leading-relaxed pl-0">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-gray-600 mb-6">Versuchen Sie es mit anderen Suchbegriffen</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/help"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Hilfe-Center
              </Link>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ihre Frage nicht gefunden?</h3>
          <p className="text-gray-600 mb-6">
            Unser Support-Team hilft Ihnen gerne weiter. Kontaktieren Sie uns über das Kontaktformular.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

