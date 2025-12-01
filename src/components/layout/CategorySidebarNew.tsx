'use client'

import { useState } from 'react'
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

  // Übersetzte Kategorien mit übersetzten Unterkategorien
  const translatedCategories = categories.map(cat => ({
    ...cat,
    name: t.categories[cat.slug as keyof typeof t.categories] || cat.name,
    subs: cat.subs.map(sub => translateSubcategory(sub)),
  }))

  if (!isOpen) return null

  const handleCategoryEnter = (index: number, event: React.MouseEvent) => {
    console.log('✅ HOVER START:', categories[index].name)
    const rect = event.currentTarget.getBoundingClientRect()

    const categoryTop = rect.top
    const categoryBottom = rect.bottom
    const viewportHeight = window.innerHeight

    // Präzise Höhenberechnung mit mehr Sicherheit
    const numSubs = categories[index].subs.length
    const headerHeight = 85 // Header + Titel im Flyout
    const rowHeight = 40 // Höhe pro Zeile (etwas mehr für Sicherheit)
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
        console.log('🔝 Clamped to top margin:', topMargin)
      }

      console.log(
        '⬆️ Shifted UP by',
        overflow,
        'px | Flyout height:',
        flyoutHeight,
        '| Final top:',
        finalTop
      )
    } else {
      console.log(
        '✅ Perfect alignment | Category:',
        categoryTop,
        '| Flyout height:',
        flyoutHeight,
        '| Space below:',
        spaceBelow
      )
    }

    setFlyoutPosition({ top: finalTop, visible: true })
    setHovered(index)
  }

  const handleCategoryLeave = () => {
    // KEIN setTimeout - wir warten auf das Flyout-Enter Event
    console.log('⏸️ CATEGORY LEAVE - Waiting for flyout...')
  }

  const handleFlyoutEnter = (index: number) => {
    console.log('🔥 FLYOUT ENTERED:', categories[index].name)
    setHovered(index)
  }

  const handleFlyoutLeave = () => {
    console.log('🚪 FLYOUT LEFT - Closing')
    setHovered(null)
    setFlyoutPosition({ top: 0, visible: false })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 998,
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '300px',
          backgroundColor: 'white',
          zIndex: 999,
          overflowY: 'auto',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10,
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.selling.allCategories}</h2>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer', border: 'none', background: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Kategorie Liste */}
        {translatedCategories.map((cat, index) => (
          <div
            key={cat.slug}
            onMouseEnter={e => handleCategoryEnter(index, e)}
            onMouseLeave={handleCategoryLeave}
            style={{ position: 'relative' }}
          >
            {/* Kategorie Link */}
            <Link
              href={`/search?category=${cat.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                textDecoration: 'none',
                color: 'inherit',
                backgroundColor: hovered === index ? '#f3f4f6' : 'white',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(() => {
                  const config = getCategoryConfig(cat.slug)
                  const IconComponent = config.icon
                  return (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: '#0f766e',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={20} color="white" />
                    </div>
                  )
                })()}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: hovered === index ? '#0f766e' : '#111827',
                  }}
                >
                  {cat.name}
                </span>
              </div>
              <ChevronRight size={16} color={hovered === index ? '#0f766e' : '#9ca3af'} />
            </Link>
          </div>
        ))}
      </div>

      {/* FLYOUT - Außerhalb des Sidebars, als separates Element */}
      {hovered !== null && (
        <div
          onMouseEnter={() => handleFlyoutEnter(hovered)}
          onMouseLeave={handleFlyoutLeave}
          style={{
            position: 'fixed',
            left: '300px',
            top: `${flyoutPosition.top}px`,
            width: '500px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: 'white',
            border: '2px solid #0f766e',
            borderRadius: '0 8px 8px 0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            padding: '24px',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '8px',
              color: '#0f766e',
            }}
          >
            {translatedCategories[hovered].name}
            <span
              style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 'normal',
                marginLeft: '8px',
              }}
            >
              ({categories[hovered].subs.length} {t.selling.categoriesCount})
            </span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {translatedCategories[hovered].subs.map((sub, idx) => (
              <Link
                key={`${translatedCategories[hovered].slug}-${idx}`}
                href={`/search?category=${translatedCategories[hovered].slug}&subcategory=${encodeURIComponent(categories[hovered].subs[idx])}`}
                onClick={onClose}
                style={{
                  padding: '10px 12px',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: '14px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  display: 'block',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa'
                  e.currentTarget.style.color = '#0f766e'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#374151'
                }}
              >
                • {translatedCategories[hovered].subs[idx]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
