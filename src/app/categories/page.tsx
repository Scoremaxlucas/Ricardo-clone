import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getCategoryConfig } from '@/data/categories'

// Ricardo-ähnliche detaillierte Kategoriestruktur
const categories = [
  {
    name: 'Auto & Motorrad',
    slug: 'auto-motorrad',
    subcategories: [
      'Autos', 'Motorräder & Roller', 'Wohnmobile & Wohnwagen', 'Boote & Wassersport',
      'Nutzfahrzeuge', 'Oldtimer', 'Auto-Ersatzteile', 'Motorrad-Ersatzteile',
      'Felgen & Reifen', 'Autoteile allgemein', 'Motorradteile allgemein'
    ]
  },
  {
    name: 'Bücher',
    slug: 'buecher',
    subcategories: [
      'Romane & Erzählungen', 'Kinder- & Jugendbücher', 'Sachbücher', 'Kochbücher',
      'Comics & Manga', 'Reiseführer', 'Fachbücher', 'Hörbücher',
      'Zeitschriften', 'Antiquarische Bücher'
    ]
  },
  {
    name: 'Computer & Netzwerk',
    slug: 'computer-netzwerk',
    subcategories: [
      'Notebooks & Laptops', 'Desktop-PCs', 'Tablets', 'Monitore & Displays',
      'Drucker & Scanner', 'Tastaturen & Mäuse', 'PC-Komponenten', 'Netzwerk-Hardware',
      'Server & Storage', 'Software', 'Gaming-PCs', 'Apple Mac',
      'Externe Festplatten', 'Webcams', 'PC-Zubehör'
    ]
  },
  {
    name: 'Fahrzeugzubehör',
    slug: 'fahrzeugzubehoer',
    subcategories: [
      'Auto-Kindersitze', 'Navigationsgeräte', 'Autoradios & Car-Audio',
      'Dachboxen & Gepäckträger', 'Felgen & Reifen', 'Autozubehör allgemein',
      'Motorrad-Bekleidung', 'Motorrad-Helme', 'Motorrad-Zubehör',
      'Winterausrüstung', 'Werkzeug & Pflege'
    ]
  },
  {
    name: 'Filme & Serien',
    slug: 'filme-serien',
    subcategories: [
      'DVDs', 'Blu-rays', 'DVD-Boxen', 'Serien auf DVD',
      'Serien auf Blu-ray', '4K Ultra HD', 'VHS-Kassetten', 'Film-Sammlungen'
    ]
  },
  {
    name: 'Foto & Optik',
    slug: 'foto-optik',
    subcategories: [
      'Digitalkameras', 'Spiegelreflexkameras', 'Objektive', 'Blitzgeräte',
      'Kamera-Zubehör', 'Stative', 'Videokameras', 'Action Cams',
      'Ferngläser', 'Teleskope', 'Drohnen mit Kamera', 'Analoge Kameras'
    ]
  },
  {
    name: 'Games & Spielkonsolen',
    slug: 'games-konsolen',
    subcategories: [
      'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One',
      'Nintendo Switch', 'PC-Spiele', 'Gaming-Zubehör', 'VR-Brillen',
      'Retro-Konsolen', 'Spiele für Switch', 'Spiele für PS5', 'Spiele für Xbox'
    ]
  },
  {
    name: 'Handwerk & Garten',
    slug: 'handwerk-garten',
    subcategories: [
      'Gartenmöbel', 'Grills & Zubehör', 'Rasenmäher', 'Pflanzen & Samen',
      'Gartengeräte', 'Elektrowerkzeuge', 'Handwerkzeuge', 'Leitern & Gerüste',
      'Gartendeko', 'Pool & Teich', 'Bewässerung', 'Gewächshäuser',
      'Kompressoren', 'Generatoren', 'Werkstatteinrichtung'
    ]
  },
  {
    name: 'Handy, Festnetz & Funk',
    slug: 'handy-telefon',
    subcategories: [
      'Smartphones', 'iPhones', 'Samsung Handys', 'Huawei Handys',
      'Handy-Zubehör', 'Smartwatches', 'Handyhüllen', 'Ladegeräte & Kabel',
      'Festnetztelefone', 'Schnurlose Telefone'
    ]
  },
  {
    name: 'Haushalt & Wohnen',
    slug: 'haushalt-wohnen',
    subcategories: [
      'Möbel', 'Sofas & Sessel', 'Tische & Stühle', 'Betten & Matratzen',
      'Schränke & Regale', 'Lampen & Leuchten', 'Teppiche', 'Gardinen & Vorhänge',
      'Küchengeräte', 'Haushaltsgeräte', 'Staubsauger', 'Waschmaschinen',
      'Kühlschränke', 'Geschirr & Besteck', 'Deko & Accessoires',
      'Bettwäsche', 'Handtücher', 'Haushaltswaren', 'Elektrokleingeräte'
    ]
  },
  {
    name: 'Kind & Baby',
    slug: 'kind-baby',
    subcategories: [
      'Babykleidung', 'Kleidung für Jungen', 'Kleidung für Mädchen',
      'Schuhe für Jungen', 'Schuhe für Mädchen', 'Kinderwagen',
      'Kinderwagen-Zubehör', 'Auto-Kindersitze', 'Kinderbetten & -möbel',
      'Babypflege & -zubehör', 'Spielzeug', 'Kindertaschen',
      'Kostüme', 'Socken für Kinder', 'Kinderhandschuhe', 'Mützen & Schals'
    ]
  },
  {
    name: 'Kleidung & Accessoires',
    slug: 'kleidung-accessoires',
    subcategories: [
      'Damenbekleidung', 'Herrenbekleidung', 'Damenschuhe', 'Herrenschuhe',
      'Taschen & Handtaschen', 'Rucksäcke', 'Koffer & Reisegepäck',
      'Gürtel', 'Schals & Tücher', 'Mützen & Caps', 'Handschuhe',
      'Sonnenbrillen', 'Uhren Damen', 'Uhren Herren', 'Schmuck',
      'Winterjacken', 'Sommerkleider', 'Jeans', 'T-Shirts & Polos',
      'Anzüge & Blazer', 'Sportbekleidung', 'Unterwäsche', 'Socken & Strümpfe'
    ]
  },
  {
    name: 'Kosmetik & Pflege',
    slug: 'kosmetik-pflege',
    subcategories: [
      'Gesichtspflege', 'Make-up', 'Parfum Damen', 'Parfum Herren',
      'Haarpflege', 'Körperpflege', 'Rasur & Epilation',
      'Maniküre & Pediküre', 'Naturkosmetik', 'Beauty-Geräte'
    ]
  },
  {
    name: 'Modellbau & Hobby',
    slug: 'modellbau-hobby',
    subcategories: [
      'Modelleisenbahn', 'RC-Autos', 'RC-Flugzeuge', 'Drohnen',
      'Modellbau-Zubehör', 'Bausätze', 'Sammelfiguren',
      'Basteln & Handarbeit', 'Malen & Zeichnen', 'Handarbeiten & Stricken'
    ]
  },
  {
    name: 'Münzen',
    slug: 'muenzen',
    subcategories: [
      'Schweizer Münzen', 'Euro-Münzen', 'Goldmünzen', 'Silbermünzen',
      'Gedenkmünzen', 'Alte Münzen', 'Münzen-Sammlungen',
      'Briefmarken', 'Münzzubehör'
    ]
  },
  {
    name: 'Musik & Musikinstrumente',
    slug: 'musik-instrumente',
    subcategories: [
      'CDs', 'Vinyl & Schallplatten', 'Musik-Boxen', 'Gitarren',
      'E-Gitarren', 'Keyboards & Pianos', 'Schlagzeuge', 'Blasinstrumente',
      'DJ-Equipment', 'Studio-Equipment', 'Verstärker', 'Musik-Zubehör',
      'Noten & Songbooks', 'Kopfhörer & In-Ears'
    ]
  },
  {
    name: 'Sammeln & Seltenes',
    slug: 'sammeln-seltenes',
    subcategories: [
      'Antiquitäten', 'Kunst & Gemälde', 'Porzellan & Keramik',
      'Silber & Besteck', 'Sammlerstücke', 'Ansichtskarten',
      'Militaria', 'Autogramme', 'Trading Cards', 'Pin & Anstecker',
      'Vintage-Artikel', 'Seltene Objekte'
    ]
  },
  {
    name: 'Spielzeug & Basteln',
    slug: 'spielzeug-basteln',
    subcategories: [
      'LEGO', 'Playmobil', 'Puppen & Zubehör', 'Actionfiguren',
      'Gesellschaftsspiele', 'Puzzle', 'Kinderfahrzeuge', 'Outdoor-Spielzeug',
      'Lernspielzeug', 'Bastelmaterial', 'Kuscheltiere'
    ]
  },
  {
    name: 'Sport',
    slug: 'sport',
    subcategories: [
      'Fahrräder', 'E-Bikes', 'Mountainbikes', 'Rennvelos', 'Fitnessgeräte',
      'Laufband & Crosstrainer', 'Ski & Snowboard', 'Skischuhe', 'Wintersport',
      'Fussball', 'Tennis', 'Golf', 'Camping & Outdoor',
      'Wandern & Trekking', 'Klettern', 'Wassersport', 'Tauchen',
      'Sportbekleidung', 'Sporttaschen', 'Sportschuhe'
    ]
  },
  {
    name: 'Tickets & Gutscheine',
    slug: 'tickets-gutscheine',
    subcategories: [
      'Konzert-Tickets', 'Sport-Tickets', 'Theater & Musical',
      'Festival-Tickets', 'Event-Tickets', 'Gutscheine',
      'Geschenkgutscheine', 'Erlebnisgutscheine'
    ]
  },
  {
    name: 'Tierzubehör',
    slug: 'tierzubehoer',
    subcategories: [
      'Hundezubehör', 'Katzenzubehör', 'Aquaristik', 'Vogel-Zubehör',
      'Pferde-Zubehör', 'Terraristik', 'Tierfutter', 'Hundebetten',
      'Katzenkratzbäume', 'Tierboxen & -körbe', 'Leinen & Halsbänder'
    ]
  },
  {
    name: 'Uhren & Schmuck',
    slug: 'uhren-schmuck',
    subcategories: [
      'Armbanduhren Herren', 'Armbanduhren Damen', 'Luxusuhren',
      'Smartwatches', 'Taschenuhren', 'Vintage-Uhren', 'Goldschmuck',
      'Silberschmuck', 'Ringe', 'Ketten & Anhänger', 'Ohrringe', 'Armbänder'
    ]
  },
  {
    name: 'Wein & Genuss',
    slug: 'wein-genuss',
    subcategories: [
      'Rotwein', 'Weisswein', 'Champagner & Sekt', 'Whisky', 'Spirituosen',
      'Kaffee & Tee', 'Delikatessen', 'Wein-Zubehör'
    ]
  }
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Alle Kategorien
          </h1>
          <p className="text-lg text-gray-600">
            {categories.length} Hauptkategorien mit über {categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)} Unterkategorien
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.slug} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Hauptkategorie Header */}
              <Link 
                href={`/search?category=${category.slug}`}
                className="block p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getCategoryConfig(category.slug)
                    const IconComponent = config.icon
                    return (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                    )
                  })()}
                  <h2 className="text-xl font-bold text-gray-900">
                    {category.name}
                  </h2>
                  <span className="ml-auto text-sm text-gray-500">
                    {category.subcategories.length} Unterkategorien
                  </span>
                </div>
              </Link>
              
              {/* Unterkategorien Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {category.subcategories.map((subcat) => (
                    <Link
                      key={`${category.slug}-${subcat}`}
                      href={`/search?category=${category.slug}&subcategory=${encodeURIComponent(subcat)}`}
                      className="text-sm text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-md transition-colors border border-transparent hover:border-primary-200"
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
