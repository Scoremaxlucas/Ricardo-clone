import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Kategorien mit ihren Slugs
const categoryData = [
  { name: 'Computer & Netzwerk', slug: 'computer-netzwerk' },
  { name: 'Kleidung & Accessoires', slug: 'kleidung-accessoires' },
  { name: 'Haushalt & Wohnen', slug: 'haushalt-wohnen' },
  { name: 'Auto & Motorrad', slug: 'auto-motorrad' },
  { name: 'Sport', slug: 'sport' },
  { name: 'Kind & Baby', slug: 'kind-baby' },
  { name: 'Bücher', slug: 'buecher' },
  { name: 'Games & Spielkonsolen', slug: 'games-konsolen' },
  { name: 'Uhren & Schmuck', slug: 'uhren-schmuck' },
  { name: 'Sammeln & Seltenes', slug: 'sammeln-seltenes' },
  { name: 'Immobilien', slug: 'immobilien' },
  { name: 'Jobs & Karriere', slug: 'jobs-karriere' },
  { name: 'Dienstleistungen', slug: 'dienstleistungen' },
  { name: 'Camping & Outdoor', slug: 'camping-outdoor' },
  { name: 'Reise & Urlaub', slug: 'reise-urlaub' },
  { name: 'Tiere', slug: 'tiere' },
  { name: 'Wellness & Gesundheit', slug: 'wellness-gesundheit' },
  { name: 'Boote & Schiffe', slug: 'boote-schiffe' },
  { name: 'Handy, Telefon & Funk', slug: 'handy-telefon' },
  { name: 'Foto & Optik', slug: 'foto-optik' },
  { name: 'Handwerk & Garten', slug: 'handwerk-garten' },
  { name: 'Musik & Instrumente', slug: 'musik-instrumente' },
  { name: 'Filme & Serien', slug: 'filme-serien' },
  { name: 'Spielzeug & Basteln', slug: 'spielzeug-basteln' },
  { name: 'Modellbau & Hobby', slug: 'modellbau-hobby' },
  { name: 'Tierzubehör', slug: 'tierzubehoer' },
  { name: 'Wein & Genuss', slug: 'wein-genuss' },
  { name: 'Büro & Gewerbe', slug: 'buero-gewerbe' },
  { name: 'Garten & Pflanzen', slug: 'garten-pflanzen' },
  { name: 'Lebensmittel', slug: 'lebensmittel' },
  { name: 'Medizin & Gesundheit', slug: 'medizin-gesundheit' },
  { name: 'Flugzeuge', slug: 'flugzeuge' },
  { name: 'Smart Home', slug: 'smart-home' },
  { name: 'Elektrogeräte', slug: 'elektrogeraete' },
  { name: 'Baustoffe', slug: 'baustoffe' },
  { name: 'Kunst & Handwerk', slug: 'kunst-handwerk' },
]

// Produktdaten für verschiedene Kategorien
const productTemplates: Record<
  string,
  Array<{
    title: string
    description: string
    brand: string
    model?: string
    price: number
    condition: string
    year?: number
    material?: string
  }>
> = {
  'computer-netzwerk': [
    {
      title: 'MacBook Pro 16" M2 Pro',
      description:
        'Neuwertiges MacBook Pro mit M2 Pro Chip, 16GB RAM, 512GB SSD. Komplett mit Original-Verpackung und Ladekabel.',
      brand: 'Apple',
      model: 'MacBook Pro 16"',
      price: 2800,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Dell XPS 15 Laptop',
      description:
        'Hochwertiger Business-Laptop mit Intel i7, 32GB RAM, 1TB SSD. Ideal für professionelle Anwendungen.',
      brand: 'Dell',
      model: 'XPS 15',
      price: 1800,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Samsung 32" 4K Monitor',
      description: 'Professioneller 4K Monitor mit HDR, ideal für Design und Gaming. Kaum benutzt.',
      brand: 'Samsung',
      model: 'U32J590',
      price: 350,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Logitech MX Master 3',
      description: 'Premium Wireless Maus mit ergonomischem Design. Perfekt für Büro und Design.',
      brand: 'Logitech',
      model: 'MX Master 3',
      price: 85,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'HP LaserJet Pro Drucker',
      description: 'Zuverlässiger Laserdrucker für Büro und Home Office. Sehr gut erhalten.',
      brand: 'HP',
      model: 'LaserJet Pro',
      price: 220,
      condition: 'Gut',
      year: 2021,
    },
    {
      title: 'ASUS ROG Gaming PC',
      description:
        'Hochleistungs-Gaming PC mit RTX 4070, Ryzen 7, 32GB RAM. Perfekt für Gaming und Streaming.',
      brand: 'ASUS',
      model: 'ROG Strix',
      price: 2200,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'iPad Pro 12.9" M2',
      description: 'Topmodell iPad Pro mit M2 Chip, 256GB, Magic Keyboard inklusive. Wie neu.',
      brand: 'Apple',
      model: 'iPad Pro 12.9"',
      price: 1400,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Corsair K70 RGB Tastatur',
      description: 'Mechanische Gaming-Tastatur mit RGB-Beleuchtung. Cherry MX Switches.',
      brand: 'Corsair',
      model: 'K70 RGB',
      price: 150,
      condition: 'Sehr gut',
      year: 2022,
    },
  ],
  'kleidung-accessoires': [
    {
      title: 'Gucci Ledertasche',
      description: 'Authentische Gucci Ledertasche in schwarz. Sehr gepflegt und selten getragen.',
      brand: 'Gucci',
      price: 850,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Nike Air Jordan 1 Retro',
      description: 'Klassische Air Jordan 1 in Rot-Weiss. Originalverpackt, Grösse 42.',
      brand: 'Nike',
      model: 'Air Jordan 1',
      price: 180,
      condition: 'Neu',
      year: 2023,
    },
    {
      title: 'Ralph Lauren Polo Shirt',
      description: 'Klassisches Polo Shirt in verschiedenen Farben. Original, Grösse L.',
      brand: 'Ralph Lauren',
      model: 'Polo',
      price: 45,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Canada Goose Parka',
      description: 'Winterparka von Canada Goose, Grösse M. Sehr warm und hochwertig verarbeitet.',
      brand: 'Canada Goose',
      model: 'Expedition Parka',
      price: 1200,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Rolex Submariner Armband',
      description: 'Original Rolex Armband für Submariner. Sehr gut erhalten.',
      brand: 'Rolex',
      model: 'Submariner Band',
      price: 250,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Louis Vuitton Gürtel',
      description: 'Authentischer LV Gürtel mit klassischem Monogramm. Sehr gepflegt.',
      brand: 'Louis Vuitton',
      price: 450,
      condition: 'Gut',
      year: 2021,
    },
    {
      title: 'Stone Island Sweatshirt',
      description: 'Premium Sweatshirt von Stone Island, Grösse M. Kaum getragen.',
      brand: 'Stone Island',
      price: 280,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Adidas Yeezy Boost 350',
      description: 'Yeezy Boost 350 in Zebra-Optik, Grösse 43. Originalverpackt.',
      brand: 'Adidas',
      model: 'Yeezy Boost 350',
      price: 220,
      condition: 'Neu',
      year: 2023,
    },
  ],
  'haushalt-wohnen': [
    {
      title: 'Miele Waschmaschine W1',
      description: 'Hochwertige Waschmaschine von Miele, 8kg. Sehr zuverlässig und sparsam.',
      brand: 'Miele',
      model: 'W1',
      price: 650,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Vitra Eames Stuhl',
      description: 'Designer-Stuhl von Vitra, Eames Design. Sehr gut erhalten, authentisch.',
      brand: 'Vitra',
      model: 'Eames',
      price: 450,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Dyson V15 Staubsauger',
      description: 'Kraftvoller Akku-Staubsauger mit Laser-Technologie. Wie neu.',
      brand: 'Dyson',
      model: 'V15',
      price: 580,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Nespresso Vertuo Kaffeemaschine',
      description: 'Premium Kaffeemaschine mit Milchaufschäumer. Komplett mit Zubehör.',
      brand: 'Nespresso',
      model: 'Vertuo',
      price: 320,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'IKEA PAX Kleiderschrank',
      description:
        'Grosser Kleiderschrank PAX System, weiss. Sehr gut erhalten, alle Teile vorhanden.',
      brand: 'IKEA',
      model: 'PAX',
      price: 380,
      condition: 'Gut',
      year: 2021,
    },
    {
      title: 'V-Zug Geschirrspüler',
      description: 'Premium Geschirrspüler von V-Zug, integrierbar. Sehr zuverlässig.',
      brand: 'V-Zug',
      model: 'Adora',
      price: 850,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Le Creuset Gusseisen-Topf',
      description: 'Hochwertiger Gusseisen-Topf in Rot, 5.5L. Perfekt für Slow Cooking.',
      brand: 'Le Creuset',
      price: 180,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Herman Miller Aeron Bürostuhl',
      description: 'Ergonomischer Bürostuhl, Grösse B. Sehr bequem und langlebig.',
      brand: 'Herman Miller',
      model: 'Aeron',
      price: 750,
      condition: 'Sehr gut',
      year: 2020,
    },
  ],
  'auto-motorrad': [
    {
      title: 'BMW 320d Limousine',
      description: "BMW 320d, 2019, 120'000 km. Sehr gepflegt, Serviceheft vorhanden.",
      brand: 'BMW',
      model: '320d',
      price: 18500,
      condition: 'Sehr gut',
      year: 2019,
    },
    {
      title: 'Audi A4 Avant',
      description: "Audi A4 Avant, 2020, 95'000 km. Vollausstattung, sehr gepflegt.",
      brand: 'Audi',
      model: 'A4 Avant',
      price: 24500,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Ducati Monster 821',
      description: "Sportliches Motorrad, 2018, 15'000 km. Sehr gut erhalten, Serviceheft.",
      brand: 'Ducati',
      model: 'Monster 821',
      price: 8500,
      condition: 'Sehr gut',
      year: 2018,
    },
    {
      title: 'Tesla Model 3',
      description: "Elektroauto, 2021, 45'000 km. Sehr gepflegt, Garantie noch aktiv.",
      brand: 'Tesla',
      model: 'Model 3',
      price: 32000,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Porsche 911 Carrera',
      description: "Sportwagen, 2017, 60'000 km. Sehr gepflegt, vollständige Historie.",
      brand: 'Porsche',
      model: '911 Carrera',
      price: 85000,
      condition: 'Sehr gut',
      year: 2017,
    },
    {
      title: 'VW Golf GTI',
      description: "Sportlicher Golf GTI, 2020, 55'000 km. Sehr gut erhalten.",
      brand: 'Volkswagen',
      model: 'Golf GTI',
      price: 28500,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Yamaha MT-07 Motorrad',
      description: "Naked Bike, 2019, 12'000 km. Sehr gut erhalten, Serviceheft.",
      brand: 'Yamaha',
      model: 'MT-07',
      price: 6200,
      condition: 'Sehr gut',
      year: 2019,
    },
    {
      title: 'Mercedes-Benz C-Klasse',
      description: "Mercedes C-Klasse, 2021, 40'000 km. Premium-Ausstattung, sehr gepflegt.",
      brand: 'Mercedes-Benz',
      model: 'C-Klasse',
      price: 35000,
      condition: 'Sehr gut',
      year: 2021,
    },
  ],
  sport: [
    {
      title: 'Trek Mountainbike X-Caliber',
      description: 'Mountainbike, Grösse M, 29 Zoll. Sehr gut erhalten, kaum gefahren.',
      brand: 'Trek',
      model: 'X-Caliber',
      price: 850,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Specialized Roadbike Tarmac',
      description: 'Rennrad, Carbon-Rahmen, 56cm. Top Zustand, professionell gewartet.',
      brand: 'Specialized',
      model: 'Tarmac',
      price: 3200,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Garmin Forerunner 945',
      description: 'GPS-Sportuhr für Laufen und Triathlon. Sehr gut erhalten.',
      brand: 'Garmin',
      model: 'Forerunner 945',
      price: 450,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Salomon Trail Running Schuhe',
      description: 'Trail Running Schuhe, Grösse 42. Sehr gut erhalten, kaum gelaufen.',
      brand: 'Salomon',
      model: 'Speedcross',
      price: 95,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Canyon E-Bike Endurace',
      description: 'E-Bike für Rennrad-Fahrer, 2022. Sehr gut erhalten, kaum gefahren.',
      brand: 'Canyon',
      model: 'Endurace:ON',
      price: 4200,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Atomic Skier',
      description: 'Ski-Set mit Bindungen, Länge 170cm. Sehr gut erhalten, professionell gewartet.',
      brand: 'Atomic',
      model: 'Redster',
      price: 450,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'NordicTrack Laufband',
      description: 'Professionelles Laufband für Zuhause. Sehr gut erhalten, kaum benutzt.',
      brand: 'NordicTrack',
      model: 'T 6.5 S',
      price: 1200,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Burton Snowboard',
      description: 'Snowboard mit Bindungen, 158cm. Sehr gut erhalten, professionell gewartet.',
      brand: 'Burton',
      model: 'Custom',
      price: 380,
      condition: 'Sehr gut',
      year: 2022,
    },
  ],
  'uhren-schmuck': [
    {
      title: 'Rolex Submariner Date',
      description: 'Klassische Rolex Submariner, 2020. Komplett mit Box und Papiere.',
      brand: 'Rolex',
      model: 'Submariner Date',
      price: 12500,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Omega Speedmaster Professional',
      description: 'Legendäre Moonwatch, 2019. Sehr gut erhalten, Box vorhanden.',
      brand: 'Omega',
      model: 'Speedmaster Pro',
      price: 4800,
      condition: 'Sehr gut',
      year: 2019,
    },
    {
      title: 'Apple Watch Ultra',
      description: 'Apple Watch Ultra, 2023. Wie neu, komplett mit Original-Zubehör.',
      brand: 'Apple',
      model: 'Watch Ultra',
      price: 750,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Breitling Navitimer',
      description: 'Klassische Navitimer, 2018. Sehr gut erhalten, Serviceheft.',
      brand: 'Breitling',
      model: 'Navitimer',
      price: 5200,
      condition: 'Sehr gut',
      year: 2018,
    },
    {
      title: 'Tag Heuer Carrera',
      description: 'Sportliche Carrera, 2021. Sehr gut erhalten, Box vorhanden.',
      brand: 'Tag Heuer',
      model: 'Carrera',
      price: 3200,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Seiko Prospex Taucheruhr',
      description: 'Professionelle Taucheruhr, 2022. Sehr gut erhalten, kaum getragen.',
      brand: 'Seiko',
      model: 'Prospex',
      price: 450,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Cartier Santos',
      description: 'Luxus-Armbanduhr, 2020. Sehr gut erhalten, Box und Papiere.',
      brand: 'Cartier',
      model: 'Santos',
      price: 6800,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Tudor Black Bay',
      description: 'Tudor Black Bay, 2021. Sehr gut erhalten, Box vorhanden.',
      brand: 'Tudor',
      model: 'Black Bay',
      price: 3200,
      condition: 'Sehr gut',
      year: 2021,
    },
  ],
  'handy-telefon': [
    {
      title: 'iPhone 15 Pro Max',
      description: 'Neuestes iPhone, 256GB, Titan. Wie neu, komplett mit Original-Zubehör.',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      price: 1350,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Samsung Galaxy S23 Ultra',
      description: 'Top-Smartphone, 256GB. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      price: 950,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Google Pixel 8 Pro',
      description: 'Premium Android-Smartphone, 128GB. Wie neu, komplett mit Zubehör.',
      brand: 'Google',
      model: 'Pixel 8 Pro',
      price: 850,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'iPad Air M2',
      description: 'iPad Air mit M2 Chip, 256GB. Wie neu, komplett mit Zubehör.',
      brand: 'Apple',
      model: 'iPad Air',
      price: 750,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'OnePlus 11',
      description: 'Flagship-Smartphone, 256GB. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'OnePlus',
      model: 'OnePlus 11',
      price: 650,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Xiaomi 13 Pro',
      description: 'Premium-Smartphone, 256GB. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Xiaomi',
      model: '13 Pro',
      price: 580,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Samsung Galaxy Tab S9',
      description: 'Premium-Tablet, 256GB. Wie neu, komplett mit Zubehör.',
      brand: 'Samsung',
      model: 'Galaxy Tab S9',
      price: 850,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Fairphone 5',
      description: 'Nachhaltiges Smartphone, 256GB. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Fairphone',
      model: 'Fairphone 5',
      price: 650,
      condition: 'Sehr gut',
      year: 2023,
    },
  ],
  'foto-optik': [
    {
      title: 'Canon EOS R5',
      description: 'Professionelle Spiegelreflexkamera, 45MP. Sehr gut erhalten, kaum benutzt.',
      brand: 'Canon',
      model: 'EOS R5',
      price: 3800,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Nikon D850',
      description: 'Professionelle DSLR, 45MP. Sehr gut erhalten, Serviceheft vorhanden.',
      brand: 'Nikon',
      model: 'D850',
      price: 2800,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Sony Alpha 7 IV',
      description: 'Spiegellose Vollformat-Kamera, 33MP. Sehr gut erhalten, kaum benutzt.',
      brand: 'Sony',
      model: 'Alpha 7 IV',
      price: 2400,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'DJI Mavic 3 Drohne',
      description: 'Professionelle Drohne mit 4K-Kamera. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'DJI',
      model: 'Mavic 3',
      price: 1800,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'GoPro Hero 12',
      description: 'Action-Kamera, 4K. Wie neu, komplett mit Zubehör.',
      brand: 'GoPro',
      model: 'Hero 12',
      price: 450,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Canon EF 24-70mm Objektiv',
      description: 'Professionelles Zoom-Objektiv, f/2.8. Sehr gut erhalten.',
      brand: 'Canon',
      model: 'EF 24-70mm',
      price: 1200,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Leica M11',
      description: 'Luxus-Kamera, 60MP. Sehr gut erhalten, Box vorhanden.',
      brand: 'Leica',
      model: 'M11',
      price: 8500,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Fujifilm X-T5',
      description: 'Spiegellose Kamera, 40MP. Sehr gut erhalten, kaum benutzt.',
      brand: 'Fujifilm',
      model: 'X-T5',
      price: 1800,
      condition: 'Sehr gut',
      year: 2023,
    },
  ],
  'games-konsolen': [
    {
      title: 'PlayStation 5',
      description: 'PS5 Konsole, 825GB. Wie neu, komplett mit Controller und Kabeln.',
      brand: 'Sony',
      model: 'PlayStation 5',
      price: 550,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Xbox Series X',
      description: 'Xbox Series X Konsole, 1TB. Sehr gut erhalten, komplett mit Controller.',
      brand: 'Microsoft',
      model: 'Xbox Series X',
      price: 520,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Nintendo Switch OLED',
      description: 'Switch OLED Konsole. Wie neu, komplett mit Zubehör.',
      brand: 'Nintendo',
      model: 'Switch OLED',
      price: 320,
      condition: 'Wie neu',
      year: 2023,
    },
    {
      title: 'Steam Deck',
      description: 'Handheld Gaming PC, 512GB. Sehr gut erhalten, kaum benutzt.',
      brand: 'Valve',
      model: 'Steam Deck',
      price: 650,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Alienware Gaming PC',
      description: 'Gaming PC mit RTX 4080, Ryzen 9. Sehr gut erhalten, professionell gewartet.',
      brand: 'Alienware',
      model: 'Aurora R15',
      price: 3200,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Razer Gaming Laptop',
      description: 'Gaming Laptop, RTX 4070, 16GB RAM. Sehr gut erhalten.',
      brand: 'Razer',
      model: 'Blade 16',
      price: 2800,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Logitech G Pro X Headset',
      description: 'Premium Gaming-Headset mit 7.1 Surround. Sehr gut erhalten.',
      brand: 'Logitech',
      model: 'G Pro X',
      price: 120,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'SteelSeries Apex Pro Tastatur',
      description: 'Mechanische Gaming-Tastatur mit RGB. Sehr gut erhalten.',
      brand: 'SteelSeries',
      model: 'Apex Pro',
      price: 180,
      condition: 'Sehr gut',
      year: 2022,
    },
  ],
  'musik-instrumente': [
    {
      title: 'Fender Stratocaster',
      description: 'Klassische E-Gitarre, Made in USA. Sehr gut erhalten, professionell gewartet.',
      brand: 'Fender',
      model: 'Stratocaster',
      price: 1200,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Gibson Les Paul',
      description: 'Legendäre Les Paul, 2019. Sehr gut erhalten, Original-Hardcase.',
      brand: 'Gibson',
      model: 'Les Paul',
      price: 2800,
      condition: 'Sehr gut',
      year: 2019,
    },
    {
      title: 'Yamaha P-125 Klavier',
      description: 'Digitales Klavier, 88 Tasten. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Yamaha',
      model: 'P-125',
      price: 650,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Roland TD-17 E-Drums',
      description: 'Elektronisches Schlagzeug, 5-Pad. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Roland',
      model: 'TD-17',
      price: 1200,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Taylor 314ce Akustikgitarre',
      description: 'Premium Akustikgitarre, Cutaway. Sehr gut erhalten, Original-Hardcase.',
      brand: 'Taylor',
      model: '314ce',
      price: 1800,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Shure SM58 Mikrofon',
      description: 'Professionelles Gesangsmikrofon. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Shure',
      model: 'SM58',
      price: 95,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Nord Stage 3 Keyboard',
      description: 'Professionelles Stage-Keyboard, 88 Tasten. Sehr gut erhalten.',
      brand: 'Nord',
      model: 'Stage 3',
      price: 3500,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Pearl Export Schlagzeug',
      description: '5-Piece Schlagzeug-Set. Sehr gut erhalten, professionell gewartet.',
      brand: 'Pearl',
      model: 'Export',
      price: 850,
      condition: 'Sehr gut',
      year: 2021,
    },
  ],
  'camping-outdoor': [
    {
      title: 'Coleman Instant Zelt',
      description: 'Schnellaufbau-Zelt für 4 Personen. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Coleman',
      model: 'Instant Tent',
      price: 280,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'The North Face Rucksack',
      description: 'Wanderrucksack, 65L. Sehr gut erhalten, kaum benutzt.',
      brand: 'The North Face',
      model: 'Terra 65',
      price: 180,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'MSR Hubba Hubba Zelt',
      description: 'Leichtgewicht-Zelt für 2 Personen. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'MSR',
      model: 'Hubba Hubba',
      price: 450,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Jetboil Kocher',
      description: 'Kompakter Gaskocher für Outdoor. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Jetboil',
      model: 'Flash',
      price: 95,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Deuter Rucksack',
      description: 'Wanderrucksack, 50L. Sehr gut erhalten, kaum benutzt.',
      brand: 'Deuter',
      model: 'Aircontact',
      price: 150,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Therm-a-Rest Schlafmatte',
      description: 'Isolierte Schlafmatte, selbstaufblasend. Sehr gut erhalten.',
      brand: 'Therm-a-Rest',
      model: 'NeoAir',
      price: 120,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Black Diamond Stirnlampe',
      description: 'Professionelle Stirnlampe mit hoher Leuchtkraft. Sehr gut erhalten.',
      brand: 'Black Diamond',
      model: 'Spot',
      price: 45,
      condition: 'Sehr gut',
      year: 2023,
    },
    {
      title: 'Patagonia Daunenjacke',
      description: 'Warme Daunenjacke für Outdoor, Grösse M. Sehr gut erhalten.',
      brand: 'Patagonia',
      model: 'Down Sweater',
      price: 280,
      condition: 'Sehr gut',
      year: 2022,
    },
  ],
  'kind-baby': [
    {
      title: 'Bugaboo Kinderwagen',
      description: 'Premium Kinderwagen, komplett mit Zubehör. Sehr gut erhalten.',
      brand: 'Bugaboo',
      model: 'Fox 3',
      price: 850,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Stokke Hochstuhl',
      description: 'Ergonomischer Hochstuhl, wachstumsmitwachsend. Sehr gut erhalten.',
      brand: 'Stokke',
      model: 'Tripp Trapp',
      price: 220,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Maxi-Cosi Autositz',
      description: 'Sicherer Autositz für Kleinkinder. Sehr gut erhalten, TÜV-geprüft.',
      brand: 'Maxi-Cosi',
      model: 'Axissfix',
      price: 180,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'LEGO Star Wars Set',
      description: 'Grosses LEGO Set, 2000+ Teile. Komplett, Originalverpackt.',
      brand: 'LEGO',
      model: 'Millennium Falcon',
      price: 450,
      condition: 'Neu',
      year: 2023,
    },
    {
      title: 'Cybex Kinderwagen',
      description: 'Sportlicher Kinderwagen, 3-in-1. Sehr gut erhalten, komplett mit Zubehör.',
      brand: 'Cybex',
      model: 'Priam',
      price: 650,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Playmobil Ritterburg',
      description: 'Grosses Playmobil Set, komplett. Sehr gut erhalten, alle Teile vorhanden.',
      brand: 'Playmobil',
      model: 'Ritterburg',
      price: 120,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Chicco Laufgitter',
      description: 'Sicheres Laufgitter, zusammenklappbar. Sehr gut erhalten.',
      brand: 'Chicco',
      model: 'Laufgitter',
      price: 95,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Fisher-Price Spielzeug',
      description: 'Verschiedene Spielzeuge von Fisher-Price. Sehr gut erhalten.',
      brand: 'Fisher-Price',
      price: 45,
      condition: 'Sehr gut',
      year: 2022,
    },
  ],
  buecher: [
    {
      title: 'Harry Potter Gesamtausgabe',
      description: 'Komplette Harry Potter Reihe, Hardcover. Sehr gut erhalten.',
      brand: 'Bloomsbury',
      price: 120,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Kochbuch "Die Kunst des Kochens"',
      description: 'Premium Kochbuch mit 500+ Rezepten. Sehr gut erhalten.',
      brand: 'Random House',
      price: 45,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Lonely Planet Reiseführer',
      description: 'Reiseführer für verschiedene Destinationen. Sehr gut erhalten.',
      brand: 'Lonely Planet',
      price: 25,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Sachbuch "Geschichte der Schweiz"',
      description: 'Umfassendes Geschichtsbuch. Sehr gut erhalten.',
      brand: 'NZZ Libro',
      price: 35,
      condition: 'Sehr gut',
      year: 2021,
    },
    {
      title: 'Roman "Der Alchimist"',
      description: 'Bestseller-Roman von Paulo Coelho. Sehr gut erhalten.',
      brand: 'Diogenes',
      price: 12,
      condition: 'Sehr gut',
      year: 2020,
    },
    {
      title: 'Comic-Sammlung',
      description: 'Verschiedene Comics, gut erhalten. Verschiedene Titel.',
      brand: 'Marvel/DC',
      price: 85,
      condition: 'Gut',
      year: 2021,
    },
    {
      title: 'Fachbuch "Programmierung"',
      description: 'Umfassendes Programmierbuch. Sehr gut erhalten.',
      brand: "O'Reilly",
      price: 55,
      condition: 'Sehr gut',
      year: 2022,
    },
    {
      title: 'Kinderbuch-Sammlung',
      description: 'Verschiedene Kinderbücher, gut erhalten. Verschiedene Titel.',
      brand: 'Verschiedene',
      price: 35,
      condition: 'Gut',
      year: 2022,
    },
  ],
}

// Zufällige Auswahl aus Array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Zufällige Zahl zwischen min und max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Zufällige Zahl zwischen min und max (Float)
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Zufälliges Datum in der Zukunft (für Auktionen)
function randomFutureDate(days: number): Date {
  return new Date(Date.now() + randomInt(1, days) * 24 * 60 * 60 * 1000)
}

// Zufälliges Datum in der Vergangenheit
function randomPastDate(days: number): Date {
  return new Date(Date.now() - randomInt(1, days) * 24 * 60 * 60 * 1000)
}

// Zufällige Bilder (Placeholder/Unsplash) - als JSON-Array
// Echte Unsplash Photo IDs für verschiedene Kategorien
const unsplashPhotos = [
  '1523275335684-37898b6baf30', // Watch
  '1517336714731-489689fd1ca8', // Watch
  '1578662996442-48f60103fc96', // Watch
  '1498049794561-7780e7231661', // Laptop
  '1512499617640-74b136d3e1ff', // Phone
  '1502920917128-1aaed76472fd', // Camera
  '1558618047-3c8c76ca7d13', // Bike
  '1549317661-bd32c8ce0db2', // Car
  '1586023492125-27b2c045efd7', // Furniture
  '1441986300917-64674bd600d8', // Clothing
  '1571019613454-1cb2f99b2d8b', // Sports
  '1556912172-45b7abe8b7e6', // Product
  '1505740420928-5e560c06d30e', // Headphones
  '1526170375885-4d8ecf77b99a', // Camera
  '1553062407-45890bcff9dd', // Watch
  '1511707171634-5f897ff02aa9', // Phone
  '1505744386684-5b3831f6c723', // Laptop
  '1558618666-fcd25c85cd64', // Bike
  '1549317661-bd32c8ce0db2', // Car
  '1555041469-a586c61ea9bc', // Furniture
]

function randomImage(): string {
  // Erstelle ein Array mit 1-3 Bildern
  const numImages = randomInt(1, 3)
  const images: string[] = []
  for (let i = 0; i < numImages; i++) {
    const photoId = randomItem(unsplashPhotos)
    // Verwende Unsplash Source API für zuverlässige Bilder
    images.push(`https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format`)
  }
  // Speichere als JSON-String (wie die API es erwartet)
  return JSON.stringify(images)
}

async function main() {
  console.log('🚀 Starte Erstellung von vielen Produkten...\n')

  // Alle bestehenden Benutzer abrufen
  const users = await prisma.user.findMany()

  if (users.length === 0) {
    console.log('❌ Keine Benutzer gefunden. Bitte erstelle zuerst Benutzer.')
    return
  }

  console.log(`📊 Gefunden: ${users.length} Benutzer\n`)

  // Alle Kategorien erstellen oder abrufen
  console.log('📁 Erstelle/Prüfe Kategorien...')
  const categories = await Promise.all(
    categoryData.map(cat =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name, // Update name falls geändert
        },
        create: {
          name: cat.name,
          slug: cat.slug,
        },
      })
    )
  )
  console.log(`✅ ${categories.length} Kategorien bereit\n`)

  // Booster abrufen
  const boosters = await prisma.boosterPrice.findMany({
    where: { isActive: true },
  })

  if (boosters.length === 0) {
    console.log('⚠️  Keine Booster gefunden. Erstelle Standard-Booster...')
    const defaultBoosters = [
      {
        code: 'none',
        name: 'Kein Booster',
        description: 'Kein Booster',
        price: 0.0,
        isActive: true,
      },
      { code: 'boost', name: 'Boost', description: 'Boost', price: 10.0, isActive: true },
      {
        code: 'turbo-boost',
        name: 'Turbo-Boost',
        description: 'Turbo-Boost',
        price: 25.0,
        isActive: true,
      },
      {
        code: 'super-boost',
        name: 'Super-Boost',
        description: 'Super-Boost',
        price: 45.0,
        isActive: true,
      },
    ]
    for (const booster of defaultBoosters) {
      await prisma.boosterPrice.upsert({
        where: { code: booster.code },
        update: {},
        create: booster,
      })
    }
    console.log('✅ Standard-Booster erstellt\n')
  }

  const allBoosters = await prisma.boosterPrice.findMany({
    where: { isActive: true },
  })

  // Produkte erstellen
  const totalProducts = 500 // Hunderte von Produkten
  const productsPerUser = Math.ceil(totalProducts / users.length)

  console.log(`📦 Erstelle ${totalProducts} Produkte (ca. ${productsPerUser} pro Benutzer)...\n`)

  let created = 0
  let errors = 0

  for (const user of users) {
    console.log(`👤 Erstelle Produkte für: ${user.name || user.email}`)

    for (let i = 0; i < productsPerUser; i++) {
      try {
        // Zufällige Kategorie auswählen
        const category = randomItem(categories)
        const categorySlug = category.slug

        // Produkt-Template auswählen (falls vorhanden, sonst generisches)
        let productTemplate
        if (productTemplates[categorySlug] && productTemplates[categorySlug].length > 0) {
          productTemplate = randomItem(productTemplates[categorySlug])
        } else {
          // Generisches Template
          productTemplate = {
            title: `${category.name} Artikel ${i + 1}`,
            description: `Hochwertiger ${category.name} Artikel in sehr gutem Zustand. Sehr gepflegt und selten benutzt.`,
            brand: 'Verschiedene',
            price: randomFloat(50, 500),
            condition: randomItem(['Neu', 'Wie neu', 'Sehr gut', 'Gut']),
            year: randomInt(2020, 2023),
          }
        }

        // Zufällig: Auktion oder Sofortkauf
        const isAuction = Math.random() > 0.6 // 40% Auktionen
        let auctionStart: Date | null = null
        let auctionEnd: Date | null = null
        let auctionDuration: number | null = null

        if (isAuction) {
          auctionStart = new Date()
          auctionDuration = randomInt(3, 14) // 3-14 Tage
          auctionEnd = new Date(auctionStart.getTime() + auctionDuration * 24 * 60 * 60 * 1000)
        }

        // Zufälliger Booster (30% keine, 30% boost, 25% turbo-boost, 15% super-boost)
        const boosterRand = Math.random()
        let boosterCode = 'none'
        if (boosterRand < 0.3) {
          boosterCode = 'none'
        } else if (boosterRand < 0.6) {
          boosterCode = 'boost'
        } else if (boosterRand < 0.85) {
          boosterCode = 'turbo-boost'
        } else {
          boosterCode = 'super-boost'
        }

        // Preis-Variation (±20%)
        const priceVariation = randomFloat(0.8, 1.2)
        const finalPrice = Math.round(productTemplate.price * priceVariation)

        // Erstelle Produkt
        const watch = await prisma.watch.create({
          data: {
            title: productTemplate.title,
            description: productTemplate.description,
            brand: productTemplate.brand,
            model: productTemplate.model || 'Standard',
            year: productTemplate.year,
            condition: productTemplate.condition,
            material: productTemplate.material || 'Verschiedene',
            movement: 'Automatik', // Für Uhren, sonst irrelevant
            caseSize: productTemplate.year ? randomFloat(38, 45) : null,
            price: finalPrice,
            buyNowPrice: isAuction ? Math.round(finalPrice * 1.3) : null,
            isAuction: isAuction,
            auctionStart: auctionStart,
            auctionEnd: auctionEnd,
            auctionDuration: auctionDuration,
            autoRenew: isAuction && Math.random() > 0.7, // 30% auto-renew
            images: randomImage(),
            shippingMethod: JSON.stringify(['pickup', 'b-post']),
            boosters: JSON.stringify([boosterCode]),
            categories: {
              create: [{ categoryId: category.id }],
            },
            sellerId: user.id,
          },
        })

        created++
        if (created % 50 === 0) {
          console.log(`   ✅ ${created} Produkte erstellt...`)
        }
      } catch (error: any) {
        errors++
        console.error(`   ❌ Fehler bei Produkt ${i + 1}:`, error.message)
      }
    }

    console.log(`   ✅ Fertig für ${user.name || user.email}\n`)
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ ERFOLGREICH ABGESCHLOSSEN!`)
  console.log(`📊 Statistiken:`)
  console.log(`   - Erstellt: ${created} Produkte`)
  console.log(`   - Fehler: ${errors}`)
  console.log(`   - Benutzer: ${users.length}`)
  console.log(`   - Kategorien: ${categories.length}`)
  console.log('='.repeat(50))
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
