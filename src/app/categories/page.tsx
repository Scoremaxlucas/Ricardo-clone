import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getCategoryConfig } from '@/data/categories'

// Detaillierte Kategoriestruktur
const categories = [
  {
    name: 'Auto & Motorrad',
    slug: 'auto-motorrad',
    subcategories: [
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
    subcategories: [
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
    name: 'Computer & Netzwerk',
    slug: 'computer-netzwerk',
    subcategories: [
      'Notebooks & Laptops',
      'Desktop-PCs',
      'Tablets',
      'Monitore & Displays',
      'Drucker & Scanner',
      'Tastaturen & Mäuse',
      'PC-Komponenten',
      'Netzwerk-Hardware',
      'Server & Storage',
      'Software',
      'Gaming-PCs',
      'Apple Mac',
      'Externe Festplatten',
      'Webcams',
      'PC-Zubehör',
    ],
  },
  {
    name: 'Fahrzeugzubehör',
    slug: 'fahrzeugzubehoer',
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
      'Möbel',
      'Sofas & Sessel',
      'Tische & Stühle',
      'Betten & Matratzen',
      'Schränke & Regale',
      'Lampen & Leuchten',
      'Teppiche',
      'Gardinen & Vorhänge',
      'Küchengeräte',
      'Haushaltsgeräte',
      'Staubsauger',
      'Waschmaschinen',
      'Kühlschränke',
      'Geschirr & Besteck',
      'Deko & Accessoires',
      'Bettwäsche',
      'Handtücher',
      'Haushaltswaren',
      'Elektrokleingeräte',
    ],
  },
  {
    name: 'Kind & Baby',
    slug: 'kind-baby',
    subcategories: [
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
    subcategories: [
      'Damenbekleidung',
      'Herrenbekleidung',
      'Damenschuhe',
      'Herrenschuhe',
      'Taschen & Handtaschen',
      'Rucksäcke',
      'Koffer & Reisegepäck',
      'Gürtel',
      'Schals & Tücher',
      'Mützen & Caps',
      'Handschuhe',
      'Sonnenbrillen',
      'Uhren Damen',
      'Uhren Herren',
      'Schmuck',
      'Winterjacken',
      'Sommerkleider',
      'Jeans',
      'T-Shirts & Polos',
      'Anzüge & Blazer',
      'Sportbekleidung',
      'Unterwäsche',
      'Socken & Strümpfe',
    ],
  },
  {
    name: 'Kosmetik & Pflege',
    slug: 'kosmetik-pflege',
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
      'CDs',
      'Vinyl & Schallplatten',
      'Musik-Boxen',
      'Gitarren',
      'E-Gitarren',
      'Keyboards & Pianos',
      'Schlagzeuge',
      'Blasinstrumente',
      'DJ-Equipment',
      'Studio-Equipment',
      'Verstärker',
      'Musik-Zubehör',
      'Noten & Songbooks',
      'Kopfhörer & In-Ears',
    ],
  },
  {
    name: 'Sammeln & Seltenes',
    slug: 'sammeln-seltenes',
    subcategories: [
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
    subcategories: [
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
    subcategories: [
      'Fahrräder',
      'E-Bikes',
      'Mountainbikes',
      'Rennvelos',
      'Fitnessgeräte',
      'Laufband & Crosstrainer',
      'Ski & Snowboard',
      'Skischuhe',
      'Wintersport',
      'Fussball',
      'Tennis',
      'Golf',
      'Camping & Outdoor',
      'Wandern & Trekking',
      'Klettern',
      'Wassersport',
      'Tauchen',
      'Sportbekleidung',
      'Sporttaschen',
      'Sportschuhe',
    ],
  },
  {
    name: 'Tickets & Gutscheine',
    slug: 'tickets-gutscheine',
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-4 sm:py-8 md:py-12 lg:px-8">
        <div className="mb-6 text-center md:mb-10">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:mb-4 md:text-4xl">Alle Kategorien</h1>
          <p className="text-sm text-gray-600 md:text-lg">
            {categories.length} Hauptkategorien mit über{' '}
            {categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)} Unterkategorien
          </p>
        </div>

        <div className="space-y-4 md:space-y-8">
          {categories.map(category => (
            <div
              key={category.slug}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Hauptkategorie Header */}
              <Link
                href={`/search?category=${category.slug}`}
                className="block border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 md:p-6"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  {(() => {
                    const config = getCategoryConfig(category.slug)
                    const IconComponent = config.icon
                    return (
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-5 w-5 text-white md:h-7 md:w-7" />
                      </div>
                    )
                  })()}
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg md:text-xl">{category.name}</h2>
                  <span className="ml-auto text-xs text-gray-500 md:text-sm">
                    {category.subcategories.length} Unterkategorien
                  </span>
                </div>
              </Link>

              {/* Unterkategorien Grid */}
              <div className="p-3 md:p-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
                  {category.subcategories.map(subcat => (
                    <Link
                      key={`${category.slug}-${subcat}`}
                      href={`/search?category=${category.slug}&subcategory=${encodeURIComponent(subcat)}`}
                      className="rounded-md border border-transparent px-2 py-1.5 text-xs text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {subcat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
