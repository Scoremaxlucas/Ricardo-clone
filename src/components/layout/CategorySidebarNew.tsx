'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCategoryConfig } from '@/data/categories'

// Vollständige Kategoriedaten
const categories = [
  {
    name: 'Auto & Motorrad',
    slug: 'auto-motorrad',
    subs: [
      'Autos',
      'Motorräder & Roller',
      'Wohnmobile & Wohnwagen',
      'Boote & Wassersport',
      'Nutzfahrzeuge',
      'Oldtimer',
      'Auto-Ersatzteile',
      'Motorrad-Ersatzteile',
      'Felgen & Reifen',
      'Autoteile allgemein',
      'Motorradteile allgemein',
    ],
  },
  {
    name: 'Bücher',
    slug: 'buecher',
    subs: [
      'Romane & Erzählungen',
      'Kinder- & Jugendbücher',
      'Sachbücher',
      'Kochbücher',
      'Comics & Manga',
      'Reiseführer',
      'Fachbücher',
      'Hörbücher',
      'Zeitschriften',
      'Antiquarische Bücher',
    ],
  },
  {
    name: 'Büro & Gewerbe',
    slug: 'buero-gewerbe',
    subs: [
      'Kalender',
      'Agrar, Forst & Bauen',
      'Schreiben & Zeichnen',
      'Kugelschreiber',
      'Schulbedarf',
      'Hefte',
      'Ordner',
      'Büromöbel',
      'Schreibtische',
      'Bürostühle',
      'Aktenschränke',
      'Bürobedarf',
      'Arbeitskleidung & -schutz',
      'Sicherheitsschuhe',
      'Gastronomie & Hotel',
      'Bürotechnik',
      'Kopierer',
      'Laborbedarf',
    ],
  },
  {
    name: 'Computer & Netzwerk',
    slug: 'computer-netzwerk',
    subs: [
      'Notebooks & Laptops',
      'Desktop-PCs',
      'Gaming-PCs',
      'Tablets',
      'Monitore & Displays',
      'Gaming-Monitore',
      'Drucker',
      'Scanner',
      'Multifunktionsgeräte',
      'Tastaturen',
      'Gaming-Tastaturen',
      'Mäuse',
      'Gaming-Mäuse',
      'PC-Komponenten',
      'Grafikkarten',
      'Prozessoren',
      'Mainboards',
      'RAM-Speicher',
      'Gehäuse',
      'Netzteile',
      'Netzwerk-Hardware',
      'Router',
      'Switches',
      'WLAN-Adapter',
      'Server & Storage',
      'NAS-Systeme',
      'Externe Festplatten',
      'SSDs',
      'Software',
      'Apple Mac',
      'MacBooks',
      'iMacs',
      'Webcams',
      'Headsets',
      'Lautsprecher',
      'USB-Kabel',
      'Adapter',
      'Dockingstations',
      'PC-Zubehör',
    ],
  },
  {
    name: 'Fahrzeugzubehör',
    slug: 'fahrzeugzubehoer',
    subs: [
      'Auto-Kindersitze',
      'Navigationsgeräte',
      'Autoradios & Car-Audio',
      'Dachboxen & Gepäckträger',
      'Felgen & Reifen',
      'Autozubehör allgemein',
      'Motorrad-Bekleidung',
      'Motorrad-Helme',
      'Motorrad-Zubehör',
      'Winterausrüstung',
      'Werkzeug & Pflege',
    ],
  },
  {
    name: 'Filme & Serien',
    slug: 'filme-serien',
    subs: [
      'DVDs',
      'Blu-rays',
      'DVD-Boxen',
      'Serien auf DVD',
      'Serien auf Blu-ray',
      '4K Ultra HD',
      'VHS-Kassetten',
      'Film-Sammlungen',
    ],
  },
  {
    name: 'Foto & Optik',
    slug: 'foto-optik',
    subs: [
      'Digitalkameras',
      'Spiegelreflexkameras',
      'Objektive',
      'Blitzgeräte',
      'Kamera-Zubehör',
      'Stative',
      'Videokameras',
      'Action Cams',
      'Ferngläser',
      'Teleskope',
      'Drohnen mit Kamera',
      'Analoge Kameras',
    ],
  },
  {
    name: 'Games & Spielkonsolen',
    slug: 'games-konsolen',
    subs: [
      'PlayStation 5',
      'PlayStation 4',
      'Xbox Series X/S',
      'Xbox One',
      'Nintendo Switch',
      'PC-Spiele',
      'Gaming-Zubehör',
      'VR-Brillen',
      'Retro-Konsolen',
      'Spiele für Switch',
      'Spiele für PS5',
      'Spiele für Xbox',
    ],
  },
  {
    name: 'Handwerk & Garten',
    slug: 'handwerk-garten',
    subs: [
      'Gartenmöbel',
      'Grills & Zubehör',
      'Rasenmäher',
      'Pflanzen & Samen',
      'Gartengeräte',
      'Elektrowerkzeuge',
      'Handwerkzeuge',
      'Leitern & Gerüste',
      'Gartendeko',
      'Pool & Teich',
      'Bewässerung',
      'Gewächshäuser',
      'Kompressoren',
      'Generatoren',
      'Werkstatteinrichtung',
    ],
  },
  {
    name: 'Handy, Festnetz & Funk',
    slug: 'handy-telefon',
    subs: [
      'Smartphones',
      'iPhones',
      'Samsung Handys',
      'Huawei Handys',
      'Handy-Zubehör',
      'Smartwatches',
      'Handyhüllen',
      'Ladegeräte & Kabel',
      'Festnetztelefone',
      'Schnurlose Telefone',
    ],
  },
  {
    name: 'Haushalt & Wohnen',
    slug: 'haushalt-wohnen',
    subs: [
      'Möbel',
      'Sofas & Sessel',
      'Couches',
      'Sessel',
      'Tische & Stühle',
      'Esstische',
      'Couchtische',
      'Schreibtische',
      'Stühle',
      'Bürostühle',
      'Betten & Matratzen',
      'Doppelbetten',
      'Einzelbetten',
      'Matratzen',
      'Schränke & Regale',
      'Kleiderschränke',
      'Bücherregale',
      'Kommoden',
      'Lampen & Leuchten',
      'Deckenlampen',
      'Stehlampen',
      'Tischlampen',
      'Teppiche',
      'Wohnteppiche',
      'Orientteppiche',
      'Gardinen & Vorhänge',
      'Küchengeräte',
      'Kaffeemaschinen',
      'Mixer',
      'Toaster',
      'Backöfen',
      'Haushaltsgeräte',
      'Staubsauger',
      'Staubsaugerroboter',
      'Waschmaschinen',
      'Trockner',
      'Kühlschränke',
      'Gefrierschränke',
      'Geschirrspüler',
      'Geschirr & Besteck',
      'Teller',
      'Tassen',
      'Gläser',
      'Besteck-Sets',
      'Deko & Accessoires',
      'Vasen',
      'Bilderrahmen',
      'Kerzen',
      'Kissen',
      'Bettwäsche',
      'Bettlaken',
      'Bettdecken',
      'Kopfkissen',
      'Handtücher',
      'Haushaltswaren',
      'Aufbewahrung',
      'Elektrokleingeräte',
      'Bügeleisen',
    ],
  },
  {
    name: 'Kind & Baby',
    slug: 'kind-baby',
    subs: [
      'Babykleidung',
      'Kleidung für Jungen',
      'Kleidung für Mädchen',
      'Schuhe für Jungen',
      'Schuhe für Mädchen',
      'Kinderwagen',
      'Kinderwagen-Zubehör',
      'Auto-Kindersitze',
      'Kinderbetten & -möbel',
      'Babypflege & -zubehör',
      'Spielzeug',
      'Kindertaschen',
      'Kostüme',
      'Socken für Kinder',
      'Kinderhandschuhe',
      'Mützen & Schals',
    ],
  },
  {
    name: 'Kleidung & Accessoires',
    slug: 'kleidung-accessoires',
    subs: [
      'Damenbekleidung',
      'Kleider',
      'Röcke',
      'Blusen',
      'Damenjacken',
      'Damenhosen',
      'Damenpullover',
      'Herrenbekleidung',
      'Herrenhemden',
      'Herrenhosen',
      'Herrenjacken',
      'Herrenpullover',
      'Anzüge & Sakkos',
      'Damenschuhe',
      'Pumps',
      'Stiefel',
      'Sneakers Damen',
      'Sandalen',
      'Herrenschuhe',
      'Lederschuhe',
      'Sneakers Herren',
      'Boots',
      'Taschen & Handtaschen',
      'Leder-Handtaschen',
      'Umhängetaschen',
      'Clutches',
      'Rucksäcke',
      'Wanderrucksäcke',
      'Schulrucksäcke',
      'Koffer & Reisegepäck',
      'Hartschalenkoffer',
      'Trolleys',
      'Gürtel',
      'Ledergürtel',
      'Schals & Tücher',
      'Seidenschals',
      'Mützen & Caps',
      'Wintermützen',
      'Baseballcaps',
      'Handschuhe',
      'Lederhandschuhe',
      'Sonnenbrillen',
      'Markensonnenbrillen',
      'Uhren Damen',
      'Uhren Herren',
      'Luxusuhren',
      'Schmuck',
      'Goldschmuck',
      'Silberschmuck',
      'Ringe',
      'Ketten',
      'Ohrringe',
      'Winterjacken',
      'Daunenjacken',
      'Parkas',
      'Sommerkleider',
      'Jeans',
      'T-Shirts & Polos',
      'Sportbekleidung',
      'Laufbekleidung',
      'Unterwäsche',
      'Socken & Strümpfe',
      'Krawatten',
      'Fliegen',
    ],
  },
  {
    name: 'Kosmetik & Pflege',
    slug: 'kosmetik-pflege',
    subs: [
      'Gesichtspflege',
      'Make-up',
      'Parfum Damen',
      'Parfum Herren',
      'Haarpflege',
      'Körperpflege',
      'Rasur & Epilation',
      'Maniküre & Pediküre',
      'Naturkosmetik',
      'Beauty-Geräte',
    ],
  },
  {
    name: 'Modellbau & Hobby',
    slug: 'modellbau-hobby',
    subs: [
      'Modelleisenbahn',
      'RC-Autos',
      'RC-Flugzeuge',
      'Drohnen',
      'Modellbau-Zubehör',
      'Bausätze',
      'Sammelfiguren',
      'Basteln & Handarbeit',
      'Malen & Zeichnen',
      'Handarbeiten & Stricken',
    ],
  },
  {
    name: 'Münzen',
    slug: 'muenzen',
    subs: [
      'Schweizer Münzen',
      'Euro-Münzen',
      'Goldmünzen',
      'Silbermünzen',
      'Gedenkmünzen',
      'Alte Münzen',
      'Münzen-Sammlungen',
      'Briefmarken',
      'Münzzubehör',
    ],
  },
  {
    name: 'Musik & Musikinstrumente',
    slug: 'musik-instrumente',
    subs: [
      'CDs',
      'Vinyl & Schallplatten',
      'Musik-Kassetten',
      'Musik-Boxen',
      'Gitarren',
      'E-Gitarren',
      'Bassgitarren',
      'Akustikgitarren',
      'Keyboards & Pianos',
      'E-Pianos',
      'Synthesizer',
      'Schlagzeuge',
      'Blasinstrumente',
      'Trompeten',
      'Saxophone',
      'Klarinetten',
      'Streichinstrumente',
      'Geigen',
      'Cellos',
      'DJ-Equipment',
      'Studio-Equipment',
      'Verstärker',
      'Gitarrenverstärker',
      'PA-Anlagen',
      'Mikrofone',
      'Musik-Zubehör',
      'Gitarrensaiten',
      'Plektren',
      'Noten & Songbooks',
      'Kopfhörer & In-Ears',
      'Mundharmonikas',
      'Akkordeons',
      'Ukulelen',
      'Banjos',
    ],
  },
  {
    name: 'Sammeln & Seltenes',
    slug: 'sammeln-seltenes',
    subs: [
      'Antiquitäten',
      'Kunst & Gemälde',
      'Porzellan & Keramik',
      'Silber & Besteck',
      'Sammlerstücke',
      'Ansichtskarten',
      'Militaria',
      'Autogramme',
      'Trading Cards',
      'Pin & Anstecker',
      'Vintage-Artikel',
      'Seltene Objekte',
    ],
  },
  {
    name: 'Spielzeug & Basteln',
    slug: 'spielzeug-basteln',
    subs: [
      'LEGO',
      'Playmobil',
      'Puppen & Zubehör',
      'Actionfiguren',
      'Gesellschaftsspiele',
      'Puzzle',
      'Kinderfahrzeuge',
      'Outdoor-Spielzeug',
      'Lernspielzeug',
      'Bastelmaterial',
      'Kuscheltiere',
    ],
  },
  {
    name: 'Sport',
    slug: 'sport',
    subs: [
      'Fahrräder',
      'E-Bikes',
      'Mountainbikes',
      'Rennvelos',
      'Citybikes',
      'Fitnessgeräte',
      'Laufbänder',
      'Crosstrainer',
      'Hanteln',
      'Fitnessbänke',
      'Ski & Snowboard',
      'Ski',
      'Snowboards',
      'Skischuhe',
      'Skibekleidung',
      'Wintersport',
      'Schlittschuhe',
      'Schlitten',
      'Fussball',
      'Fussbälle',
      'Trikots',
      'Fussballschuhe',
      'Tennis',
      'Tennisschläger',
      'Tennisbälle',
      'Golf',
      'Golfschläger',
      'Golfbälle',
      'Camping & Outdoor',
      'Zelte',
      'Schlafsäcke',
      'Campingmöbel',
      'Wandern & Trekking',
      'Wanderschuhe',
      'Wanderstöcke',
      'Rucksäcke',
      'Klettern',
      'Kletterseile',
      'Karabiner',
      'Wassersport',
      'Schwimmbrillen',
      'Schnorchel',
      'Tauchen',
      'Tauchanzüge',
      'Sportbekleidung',
      'Laufbekleidung',
      'Trainingshosen',
      'Sporttaschen',
      'Sportschuhe',
      'Laufschuhe',
      'Trainingsschuhe',
      'Yoga & Pilates',
      'Yoga-Matten',
      'Boxen & Kampfsport',
      'Boxhandschuhe',
    ],
  },
  {
    name: 'Tickets & Gutscheine',
    slug: 'tickets-gutscheine',
    subs: [
      'Konzert-Tickets',
      'Sport-Tickets',
      'Theater & Musical',
      'Festival-Tickets',
      'Event-Tickets',
      'Gutscheine',
      'Geschenkgutscheine',
      'Erlebnisgutscheine',
    ],
  },
  {
    name: 'Tierzubehör',
    slug: 'tierzubehoer',
    subs: [
      'Hundezubehör',
      'Katzenzubehör',
      'Aquaristik',
      'Vogel-Zubehör',
      'Pferde-Zubehör',
      'Terraristik',
      'Tierfutter',
      'Hundebetten',
      'Katzenkratzbäume',
      'Tierboxen & -körbe',
      'Leinen & Halsbänder',
    ],
  },
  {
    name: 'Uhren & Schmuck',
    slug: 'uhren-schmuck',
    subs: [
      'Armbanduhren Herren',
      'Armbanduhren Damen',
      'Luxusuhren',
      'Smartwatches',
      'Taschenuhren',
      'Vintage-Uhren',
      'Goldschmuck',
      'Silberschmuck',
      'Ringe',
      'Ketten & Anhänger',
      'Ohrringe',
      'Armbänder',
    ],
  },
  {
    name: 'Wein & Genuss',
    slug: 'wein-genuss',
    subs: [
      'Rotwein',
      'Weisswein',
      'Champagner & Sekt',
      'Whisky',
      'Spirituosen',
      'Kaffee & Tee',
      'Delikatessen',
      'Wein-Zubehör',
    ],
  },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CategorySidebarNew({ isOpen, onClose }: Props) {
  const { t, translateSubcategory } = useLanguage()
  const [hovered, setHovered] = useState<number | null>(null)
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, visible: false })
  const [isAnimating, setIsAnimating] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Übersetzte Kategorien mit übersetzten Unterkategorien
  const translatedCategories = categories.map(cat => ({
    ...cat,
    name: t.categories[cat.slug as keyof typeof t.categories] || cat.name,
    subs: cat.subs.map(sub => translateSubcategory(sub)),
  }))

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      if (flyoutTimeoutRef.current) {
        clearTimeout(flyoutTimeoutRef.current)
      }
    }
  }, [isOpen])

  if (!isOpen && !isAnimating) return null

  const handleCategoryEnter = (index: number, event: React.MouseEvent) => {
    // Cancel any pending timeout
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const categoryTop = rect.top
    const viewportHeight = window.innerHeight

    // Präzise Höhenberechnung
    const numSubs = categories[index].subs.length
    const headerHeight = 85 // Header + Titel im Flyout
    const rowHeight = 40 // Höhe pro Zeile
    const padding = 50 // Top + Bottom Padding
    const rows = Math.ceil(numSubs / 2) // 2 Spalten
    const calculatedHeight = headerHeight + rows * rowHeight + padding
    const flyoutHeight = Math.min(600, calculatedHeight)

    const topMargin = 60 // Mindestabstand oben (wegen Header)
    const bottomMargin = 30 // Mindestabstand unten

    let finalTop = categoryTop

    // Berechne verfügbaren Platz
    const spaceBelow = viewportHeight - categoryTop - bottomMargin

    if (flyoutHeight > spaceBelow) {
      // Nicht genug Platz unten - verschiebe nach oben
      const overflow = flyoutHeight - spaceBelow
      finalTop = categoryTop - overflow

      // Stelle sicher, dass wir nicht über den oberen Rand gehen
      if (finalTop < topMargin) {
        finalTop = topMargin
      }
    }

    setFlyoutPosition({ top: finalTop, visible: true })
    setHovered(index)
  }

  const handleCategoryLeave = () => {
    // Delay before closing to allow movement to flyout
    flyoutTimeoutRef.current = setTimeout(() => {
      setHovered(null)
      setFlyoutPosition({ top: 0, visible: false })
    }, 200)
  }

  const handleFlyoutEnter = (index: number) => {
    // Cancel timeout if mouse enters flyout
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }
    setHovered(index)
  }

  const handleFlyoutLeave = () => {
    setHovered(null)
    setFlyoutPosition({ top: 0, visible: false })
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }

  return (
    <>
      {/* Backdrop with smooth fade-in */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Sidebar with smooth slide-in animation */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 w-[320px] bg-white z-[999] overflow-y-auto shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTransitionEnd={() => {
          if (!isOpen) {
            setIsAnimating(false)
          }
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{t.selling.allCategories}</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Kategorie Liste */}
        <div className="py-2">
          {translatedCategories.map((cat, index) => {
            const config = getCategoryConfig(cat.slug)
            const IconComponent = config.icon
            const isHovered = hovered === index

            return (
              <div
                key={cat.slug}
                onMouseEnter={e => handleCategoryEnter(index, e)}
                onMouseLeave={handleCategoryLeave}
                className="relative"
              >
                {/* Kategorie Link */}
                <Link
                  href={`/search?category=${cat.slug}`}
                  className={`flex items-center justify-between px-5 py-3 text-sm font-medium transition-all duration-200 ${
                    isHovered
                      ? 'bg-primary-50 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-primary-700">
                      <IconComponent size={18} className="text-white" />
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`transition-transform duration-200 ${
                      isHovered ? 'text-primary-600 translate-x-0.5' : 'text-gray-400'
                    }`}
                  />
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* FLYOUT - Außerhalb des Sidebars, als separates Element mit smooth animation */}
      {hovered !== null && (
        <div
          onMouseEnter={() => handleFlyoutEnter(hovered)}
          onMouseLeave={handleFlyoutLeave}
          className="fixed left-[320px] w-[520px] max-h-[calc(100vh-80px)] bg-white border-2 border-primary-600 rounded-r-xl shadow-2xl p-6 z-[1000] overflow-y-auto"
          style={{
            top: `${flyoutPosition.top}px`,
            animation: 'flyoutFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform, opacity',
          }}
        >
          <h3 className="mb-4 border-b-2 border-gray-100 pb-3 text-lg font-bold text-primary-700">
            {translatedCategories[hovered].name}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({categories[hovered].subs.length} {t.selling.categoriesCount})
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {translatedCategories[hovered].subs.map((sub, idx) => (
              <Link
                key={`${translatedCategories[hovered].slug}-${idx}`}
                href={`/search?category=${translatedCategories[hovered].slug}&subcategory=${encodeURIComponent(categories[hovered].subs[idx])}`}
                onClick={handleClose}
                className="group relative block rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm"
              >
                <span className="relative z-10">{sub}</span>
                <span className="absolute inset-0 rounded-lg bg-primary-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
