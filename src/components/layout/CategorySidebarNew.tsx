'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
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
  // Desktop: hover flyout
  const [hovered, setHovered] = useState<number | null>(null)
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, visible: false })
  const sidebarRef = useRef<HTMLDivElement>(null)
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mobile: drill-down navigation
  const [selectedMobileCategory, setSelectedMobileCategory] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Translated categories
  const translatedCategories = categories.map(cat => ({
    ...cat,
    name: t.categories[cat.slug as keyof typeof t.categories] || cat.name,
    subs: cat.subs.map(sub => translateSubcategory(sub)),
  }))

  // Handle body scroll + cleanup
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Reset mobile drill-down when sidebar closes
      setSelectedMobileCategory(null)
    }
    return () => {
      document.body.style.overflow = ''
      if (flyoutTimeoutRef.current) {
        clearTimeout(flyoutTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Desktop hover handlers
  const handleCategoryEnter = useCallback((index: number, event: React.MouseEvent) => {
    if (isMobile) return
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const categoryTop = rect.top
    const viewportHeight = window.innerHeight

    const numSubs = categories[index].subs.length
    const headerHeight = 85
    const rowHeight = 40
    const padding = 50
    const rows = Math.ceil(numSubs / 2)
    const calculatedHeight = headerHeight + rows * rowHeight + padding
    const flyoutHeight = Math.min(600, calculatedHeight)

    const topMargin = 60
    const bottomMargin = 30

    let finalTop = categoryTop
    const spaceBelow = viewportHeight - categoryTop - bottomMargin

    if (flyoutHeight > spaceBelow) {
      const overflow = flyoutHeight - spaceBelow
      finalTop = categoryTop - overflow
      if (finalTop < topMargin) {
        finalTop = topMargin
      }
    }

    setFlyoutPosition({ top: finalTop, visible: true })
    setHovered(index)
  }, [isMobile])

  const handleCategoryLeave = useCallback(() => {
    if (isMobile) return
    flyoutTimeoutRef.current = setTimeout(() => {
      setHovered(null)
      setFlyoutPosition({ top: 0, visible: false })
    }, 200)
  }, [isMobile])

  const handleFlyoutEnter = useCallback((index: number) => {
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current)
      flyoutTimeoutRef.current = null
    }
    setHovered(index)
  }, [])

  const handleFlyoutLeave = useCallback(() => {
    setHovered(null)
    setFlyoutPosition({ top: 0, visible: false })
  }, [])

  // Mobile: tap to drill down
  const handleMobileCategoryTap = useCallback((index: number, e: React.MouseEvent) => {
    if (!isMobile) return
    e.preventDefault()
    setSelectedMobileCategory(index)
  }, [isMobile])

  const handleMobileBack = useCallback(() => {
    setSelectedMobileCategory(null)
  }, [])

  // Track animation state separately from open state
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited')

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationState('entering')
          setTimeout(() => setAnimationState('entered'), 20)
        })
      })
    } else if (animationState === 'entered' || animationState === 'entering') {
      setAnimationState('exiting')
      setTimeout(() => {
        setAnimationState('exited')
        setShouldRender(false)
      }, 300)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setSelectedMobileCategory(null)
    onClose()
  }, [onClose])

  if (!shouldRender) return null

  const isVisible = animationState === 'entering' || animationState === 'entered'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[998] transition-all duration-300 ease-out"
        style={{
          backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
          WebkitBackdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        }}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 left-0 bottom-0 z-[999] w-full max-w-[320px] overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* 
          Mobile: two-panel drill-down using translateX.
          Panel 1 = category list, Panel 2 = subcategory list.
          When a category is selected on mobile, both panels slide left together.
        */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: '200%', // Two full-width panels side by side
            transform: isMobile && selectedMobileCategory !== null ? 'translateX(-50%)' : 'translateX(0)',
          }}
        >
          {/* ===== PANEL 1: Category List ===== */}
          <div className="h-full w-1/2 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">{t.selling.allCategories}</h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Items */}
            <div className="py-2">
              {translatedCategories.map((cat, index) => {
                const config = getCategoryConfig(cat.slug)
                const IconComponent = config.icon
                const isHoveredItem = hovered === index
                const isSelected = selectedMobileCategory === index

                return (
                  <div
                    key={cat.slug}
                    onMouseEnter={e => handleCategoryEnter(index, e)}
                    onMouseLeave={handleCategoryLeave}
                    className="relative"
                  >
                    {/* On mobile: tap opens drill-down. On desktop: link navigates, hover opens flyout. */}
                    {isMobile ? (
                      <button
                        onClick={e => handleMobileCategoryTap(index, e)}
                        className={`flex w-full items-center justify-between px-5 py-3 text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary-50 text-primary-700'
                            : 'bg-white text-gray-700 active:bg-gray-50'
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
                          className="text-gray-400"
                        />
                      </button>
                    ) : (
                      <Link
                        href={`/search?category=${cat.slug}`}
                        className={`flex items-center justify-between px-5 py-3 text-sm font-medium transition-all duration-200 ${
                          isHoveredItem
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
                            isHoveredItem ? 'text-primary-600 translate-x-0.5' : 'text-gray-400'
                          }`}
                        />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== PANEL 2: Subcategory List (Mobile drill-down) ===== */}
          <div className="h-full w-1/2 overflow-y-auto bg-white">
            {selectedMobileCategory !== null && (
              <>
                {/* Back header */}
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-4">
                    <button
                      onClick={handleMobileBack}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary-600 active:opacity-70"
                    >
                      <ChevronLeft size={18} />
                      <span>Zurück</span>
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {/* Category title with icon */}
                  <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3">
                    {(() => {
                      const config = getCategoryConfig(translatedCategories[selectedMobileCategory].slug)
                      const IconComponent = config.icon
                      return (
                        <>
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-primary-700">
                            <IconComponent size={18} className="text-white" />
                          </div>
                          <h3 className="text-base font-bold text-gray-900">
                            {translatedCategories[selectedMobileCategory].name}
                          </h3>
                          <span className="text-xs text-gray-400">
                            ({categories[selectedMobileCategory].subs.length})
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* "Alle anzeigen" link - navigates to category page */}
                <Link
                  href={`/search?category=${translatedCategories[selectedMobileCategory].slug}`}
                  onClick={handleClose}
                  className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-primary-600 active:bg-primary-50"
                >
                  Alle in {translatedCategories[selectedMobileCategory].name}
                  <ChevronRight size={14} />
                </Link>

                {/* Subcategory list */}
                <div className="py-1">
                  {translatedCategories[selectedMobileCategory].subs.map((sub, idx) => (
                    <Link
                      key={`mobile-${translatedCategories[selectedMobileCategory].slug}-${idx}`}
                      href={`/search?category=${translatedCategories[selectedMobileCategory].slug}&subcategory=${encodeURIComponent(categories[selectedMobileCategory].subs[idx])}`}
                      onClick={handleClose}
                      className="block px-5 py-2.5 text-sm text-gray-700 transition-colors active:bg-gray-50"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop FLYOUT - only shown on non-mobile */}
      {!isMobile && hovered !== null && (
        <div
          onMouseEnter={() => handleFlyoutEnter(hovered)}
          onMouseLeave={handleFlyoutLeave}
          className="fixed left-[320px] z-[1000] max-h-[calc(100vh-80px)] w-full max-w-[520px] overflow-y-auto rounded-r-xl border-2 border-primary-600 bg-white p-6 shadow-2xl"
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
