// Server Component - kein 'use client' nötig für statische Seiten

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertTriangle,
  Ban,
  FileWarning,
  Gavel,
  Heart,
  Pill,
  Shield,
  ShieldAlert,
  Swords,
  Eye,
  CreditCard,
  Ticket,
  Package,
  Scale,
  Skull,
  Baby,
  Dog,
  Cigarette,
  Flame,
  Lock,
  Copyright,
  Camera,
} from 'lucide-react'

// Kategorien der verbotenen Artikel nach Ricardo-Vorbild
const forbiddenCategories = [
  {
    id: 'intellectual-property',
    title: 'Immaterialgüterrechte / Rechte Dritter',
    icon: Copyright,
    color: 'text-purple-600 bg-purple-100',
    items: [
      'Gefälschte Waren (Markenpiraterie) und Produkte mit "inspired by"-Behauptungen',
      'Raubkopien von Musik, Filmen, Büchern, Software und Spielen',
      'Fotokopien von Lehrmaterialien, Kursunterlagen oder Skripten ohne Einwilligung',
      'Produkte, die Patente, Designs oder Urheberrechte verletzen',
      'Unlizenzierte Reproduktionen von Kunstwerken oder Sammlerstücken',
      'Schlüssel, Seriennummern oder Aktivierungscodes für Software ohne gültige Lizenz',
    ],
  },
  {
    id: 'weapons',
    title: 'Waffen & Munition',
    icon: Swords,
    color: 'text-red-600 bg-red-100',
    items: [
      'Schusswaffen aller Art (auch deaktivierte oder antike)',
      'Hieb- und Stichwaffen (Messer mit Klingenlänge über 5 cm, Schwerter, Dolche)',
      'Munition und Sprengstoff',
      'Waffenbestandteile, Magazine und Zubehör',
      'Softair-Waffen, Paintball-Markierer und Druckluftwaffen',
      'Elektroschocker, Pfefferspray und Selbstverteidigungsgeräte',
      'Schlagringe, Totschläger, Teleskopschlagstöcke',
      'Wurfsterne, Nunchakus und andere Kampfsportwaffen',
      'Armbrüste und Bögen (ausser Sport-Bögen mit Nachweis)',
    ],
  },
  {
    id: 'military',
    title: 'Militär- & Polizeiausrüstung',
    icon: Shield,
    color: 'text-slate-600 bg-slate-100',
    items: [
      'Aktuelle Uniformen der Schweizer Armee, Polizei oder Feuerwehr',
      'Tarnanzüge und militärische Tarnkleidung',
      'Militärische Ausrüstungsgegenstände (Helme, Schutzwesten, etc.)',
      'Dienstausweise, Dienstmarken oder Abzeichen von Behörden',
      'Militärische Nachtsichtgeräte',
      'Gegenstände mit NS-Symbolik oder anderen verfassungsfeindlichen Zeichen',
    ],
  },
  {
    id: 'drugs-medications',
    title: 'Drogen & Arzneimittel',
    icon: Pill,
    color: 'text-emerald-600 bg-emerald-100',
    items: [
      'Illegale Drogen und Betäubungsmittel (Cannabis, Kokain, etc.)',
      'Bewusstseinsverändernde Substanzen und "Legal Highs"',
      'Rezeptpflichtige Medikamente',
      'Apothekenpflichtige Arzneimittel',
      'Nahrungsergänzungsmittel mit nicht zugelassenen Inhaltsstoffen',
      'Dopingmittel und leistungssteigernde Substanzen',
      'Drogenutensilien (Pfeifen, Bongs, etc.)',
      'Medizinprodukte ohne CE-Kennzeichnung',
    ],
  },
  {
    id: 'tobacco-alcohol',
    title: 'Tabak & Alkohol',
    icon: Cigarette,
    color: 'text-amber-600 bg-amber-100',
    items: [
      'Tabakwaren und Zigaretten',
      'E-Zigaretten und Liquids mit Nikotin',
      'Alkoholische Getränke (ausser Sammlerflaschen, originalverpackt)',
      'Alkohol destillieren: Geräte und Anleitungen',
    ],
  },
  {
    id: 'dangerous-goods',
    title: 'Gefährliche Stoffe & Produkte',
    icon: Flame,
    color: 'text-orange-600 bg-orange-100',
    items: [
      'Explosivstoffe und Feuerwerkskörper (Kategorie F2-F4)',
      'Giftige Chemikalien und Gefahrstoffe',
      'Radioaktive Materialien',
      'Asbest und asbesthaltige Produkte',
      'Pestizide und nicht zugelassene Pflanzenschutzmittel',
      'Produkte mit gefährlichen Inhaltsstoffen ohne Kennzeichnung',
      'Gasflaschen und Druckbehälter',
      'Airbags und pyrotechnische Sicherheitsvorrichtungen',
    ],
  },
  {
    id: 'surveillance',
    title: 'Überwachung & Spionage',
    icon: Camera,
    color: 'text-gray-600 bg-gray-100',
    items: [
      'Versteckte Kameras und Spy-Cams',
      'Abhörgeräte und Wanzen',
      'GPS-Tracker zur Personenüberwachung',
      'Geräte zum Abfangen von Kommunikation',
      'Störsender (Jammer) für GPS, Mobilfunk oder WLAN',
      'Software zum Ausspionieren oder Hacken',
      'Schlüsselkopiergeräte und Lockpicking-Werkzeuge',
    ],
  },
  {
    id: 'documents',
    title: 'Dokumente & Ausweise',
    icon: CreditCard,
    color: 'text-blue-600 bg-blue-100',
    items: [
      'Ausweise, Pässe und Identitätsdokumente (echt oder gefälscht)',
      'Führerscheine und Fahrzeugausweise',
      'Diplome, Zeugnisse und Zertifikate',
      'Gebrauchte Autobahnvignetten',
      'Behördliche Genehmigungen und Lizenzen',
      'Blanko-Dokumente oder Dokumentenvorlagen',
      'Stempel und Siegel von Behörden',
    ],
  },
  {
    id: 'tickets-vouchers',
    title: 'Tickets & Gutscheine',
    icon: Ticket,
    color: 'text-pink-600 bg-pink-100',
    items: [
      'Personalisierte oder nicht übertragbare Tickets',
      'Flugtickets und Bahntickets auf Namen',
      'Eintrittskarten zu überhöhten Preisen (Wucher)',
      'Gefälschte Tickets oder Eintrittskarten',
      'Gutscheine, die zum Kauf ausserhalb der Plattform animieren',
      'Kreditkarten-Punkte, Meilen oder Bonusprogramm-Guthaben',
      'Lose und Lottoscheine',
    ],
  },
  {
    id: 'living-beings',
    title: 'Lebewesen & Körperteile',
    icon: Heart,
    color: 'text-rose-600 bg-rose-100',
    items: [
      'Lebende Tiere (ausser unter strikten Auflagen)',
      'Geschützte Tier- und Pflanzenarten (CITES)',
      'Elfenbein und Produkte aus geschützten Tieren',
      'Pelzprodukte aus nicht nachhaltiger Quelle',
      'Menschliche Organe, Körperteile oder Gewebe',
      'Blut, Plasma und Körperflüssigkeiten',
      'Menschliche Überreste (auch Haare in grossen Mengen)',
    ],
  },
  {
    id: 'adult-content',
    title: 'Jugendgefährdende Inhalte',
    icon: ShieldAlert,
    color: 'text-red-700 bg-red-100',
    items: [
      'Pornografisches Material jeglicher Art',
      'Darstellungen mit Minderjährigen in sexuellem Kontext',
      'Gewaltverherrlichende Inhalte',
      'Menschenverachtende oder rassistische Inhalte',
      'Anleitungen zur Herstellung von Waffen oder Drogen',
      'Inhalte, die zu Straftaten aufrufen',
    ],
  },
  {
    id: 'stolen-illegal',
    title: 'Gestohlene & illegale Waren',
    icon: Ban,
    color: 'text-gray-800 bg-gray-200',
    items: [
      'Gestohlene Waren oder Hehlerware',
      'Waren unbekannter Herkunft ohne Eigentumsnachweis',
      'Produkte aus Einbrüchen oder Diebstählen',
      'Fundgegenstände (gehören dem Finder nicht automatisch)',
      'Importierte Waren unter Umgehung von Zoll und Steuern',
    ],
  },
  {
    id: 'financial',
    title: 'Finanzprodukte & Währungen',
    icon: Scale,
    color: 'text-indigo-600 bg-indigo-100',
    items: [
      'Bargeld, Falschgeld und Blüten',
      'Nicht autorisierte Finanzdienstleistungen',
      'Aktien, Anleihen und Wertpapiere',
      'Kryptowährungen und Mining-Verträge',
      'Schneeballsysteme und MLM-Produkte',
      'Kreditkarten und Debitkarten',
      'Bankkonten oder Kontozugänge',
    ],
  },
  {
    id: 'children-safety',
    title: 'Kinder- & Produktsicherheit',
    icon: Baby,
    color: 'text-cyan-600 bg-cyan-100',
    items: [
      'Kindersitze ohne gültige Prüfnorm oder nach Unfall',
      'Babynahrung (nur original verpackt erlaubt)',
      'Spielzeug ohne CE-Kennzeichnung',
      'Produkte mit Erstickungsgefahr für Kleinkinder',
      'Gebrauchte Fahrradhelme und Schutzausrüstung',
      'Elektronische Geräte ohne Sicherheitszertifizierung',
    ],
  },
  {
    id: 'services-intangibles',
    title: 'Unzulässige Dienstleistungen',
    icon: FileWarning,
    color: 'text-yellow-600 bg-yellow-100',
    items: [
      'Dienstleistungen, die gegen geltendes Recht verstossen',
      'Angebote zur Umgehung von Gesetzen oder Vorschriften',
      'Ghostwriting für akademische Arbeiten',
      'Identitätsdiebstahl oder Fake-Bewertungen',
      'Hacking-Dienstleistungen',
      'Spam- oder Phishing-Dienste',
      'Escort- und sexuelle Dienstleistungen',
    ],
  },
]

export default function ForbiddenItemsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Verbotene Artikel
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
              Die folgende Liste enthält Produkte und Inhalte, die auf Helvenda nicht angeboten werden dürfen. 
              Diese Liste ist nicht abschliessend – Helvenda behält sich vor, jederzeit weitere Produkte 
              zu verbieten oder Angebote ohne Angabe von Gründen zu entfernen.
            </p>
          </div>

          {/* Wichtiger Hinweis */}
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-6">
            <div className="flex gap-3">
              <Gavel className="h-6 w-6 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="font-semibold text-amber-800">Rechtlicher Hinweis</h2>
                <p className="mt-1 text-sm text-amber-700">
                  Das Anbieten verbotener Artikel kann zur sofortigen Sperrung Ihres Kontos führen. 
                  Bei schwerwiegenden Verstössen behält sich Helvenda vor, die zuständigen Behörden 
                  zu informieren. Bereits angefallene Gebühren werden bei Verstössen nicht erstattet.
                </p>
              </div>
            </div>
          </div>

          {/* Kategorien Grid */}
          <div className="space-y-6">
            {forbiddenCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                        {category.title}
                      </h2>
                    </div>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <Ban className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ausnahmen und Sonderfälle */}
          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
            <h2 className="mb-3 font-semibold text-blue-800">Ausnahmen & Sonderfälle</h2>
            <div className="space-y-3 text-sm text-blue-700">
              <p>
                <strong>Sammler und Antiquitäten:</strong> Bestimmte historische Gegenstände 
                (z.B. antike Waffen, historische Uniformen) können unter strengen Auflagen 
                erlaubt sein. Kontaktieren Sie uns vorab unter{' '}
                <a href="mailto:support@helvenda.ch" className="underline">
                  support@helvenda.ch
                </a>.
              </p>
              <p>
                <strong>Gewerbliche Verkäufer:</strong> Für bestimmte Produktkategorien 
                (z.B. Medizinprodukte, Alkohol) können gewerbliche Verkäufer mit entsprechenden 
                Lizenzen eine Sondergenehmigung beantragen.
              </p>
              <p>
                <strong>Im Zweifelsfall:</strong> Wenn Sie unsicher sind, ob Ihr Artikel 
                erlaubt ist, kontaktieren Sie uns bitte vor dem Einstellen. Wir helfen 
                Ihnen gerne weiter.
              </p>
            </div>
          </div>

          {/* Melden von Verstössen */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="mb-3 font-semibold text-gray-900">Verstoss melden</h2>
            <p className="mb-4 text-sm text-gray-600">
              Haben Sie ein Angebot entdeckt, das gegen unsere Richtlinien verstösst? 
              Bitte melden Sie es uns, damit wir entsprechende Massnahmen ergreifen können.
            </p>
            <a
              href="mailto:support@helvenda.ch?subject=Verstoss%20melden"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <AlertTriangle className="h-4 w-4" />
              Verstoss melden
            </a>
          </div>

          {/* Footer-Hinweis */}
          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-500">
              Diese Verbotsliste ist Bestandteil der{' '}
              <a href="/terms" className="text-primary-600 hover:underline">
                Allgemeinen Geschäftsbedingungen
              </a>{' '}
              von Helvenda.
              <br />
              Stand: Januar 2026 | Änderungen vorbehalten
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
