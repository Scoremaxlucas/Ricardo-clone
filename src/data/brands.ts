// Umfassende Markenliste für alle Kategorien auf Helvenda
// Basierend auf Recherche der wichtigsten Marken weltweit

export const brandsByCategory: Record<string, string[]> = {
  // AUTO & MOTORRAD
  'auto-motorrad': [
    // Deutsche Marken
    'Audi', 'BMW', 'Mercedes-Benz', 'Mercedes', 'Porsche', 'Volkswagen', 'VW', 'Opel', 'Mini', 'Smart',
    // Japanische Marken
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Lexus', 'Acura', 'Infiniti',
    // Amerikanische Marken
    'Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Chrysler', 'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Tesla',
    // Französische Marken
    'Peugeot', 'Renault', 'Citroën', 'Citroen', 'DS Automobiles', 'Alpine',
    // Italienische Marken
    'Ferrari', 'Lamborghini', 'Maserati', 'Alfa Romeo', 'Fiat', 'Lancia',
    // Britische Marken
    'Bentley', 'Rolls-Royce', 'Aston Martin', 'Jaguar', 'Land Rover', 'Range Rover', 'McLaren', 'Lotus', 'Mini',
    // Schwedische Marken
    'Volvo', 'Koenigsegg',
    // Koreanische Marken
    'Hyundai', 'Kia', 'Genesis',
    // Chinesische Marken
    'BYD', 'Nio', 'Xpeng', 'Geely', 'Great Wall', 'MG',
    // Andere
    'Skoda', 'Seat', 'Cupra', 'Dacia', 'SsangYong', 'Mahindra', 'Tata',
    // Motorräder
    'Harley-Davidson', 'Ducati', 'Yamaha', 'Kawasaki', 'Honda Motorcycles', 'BMW Motorrad', 'Triumph', 'KTM', 'Aprilia', 'Moto Guzzi', 'MV Agusta', 'Indian', 'Royal Enfield', 'Husqvarna', 'Beta', 'GasGas'
  ],

  // UHREN & SCHMUCK
  'uhren-schmuck': [
    // Schweizer Luxus
    'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'Jaeger-LeCoultre', 'Blancpain', 'Breguet', 'Piaget', 'Chopard', 'Girard-Perregaux',
    // Schweizer Premium
    'Omega', 'Breitling', 'Tag Heuer', 'IWC', 'Panerai', 'Tudor', 'Hublot', 'Zenith', 'Longines', 'Tissot', 'Rado', 'Hamilton', 'Oris', 'Maurice Lacroix', 'Frederique Constant', 'Baume & Mercier', 'Raymond Weil', 'Eterna', 'Glycine', 'Fortis', 'Revue Thommen', 'Sinn', 'Steinhart', 'Mühle Glashütte',
    // Deutsche Marken
    'A. Lange & Söhne', 'Glashütte Original', 'Nomos Glashütte', 'Junghans', 'Stowa', 'Laco', 'Damasko', 'Archimede', 'Tutima', 'MeisterSinger',
    // Japanische Marken
    'Seiko', 'Grand Seiko', 'Citizen', 'Casio', 'Orient', 'G-Shock',
    // Andere Luxus
    'Cartier', 'Bulgari', 'Van Cleef & Arpels', 'Hermès', 'Louis Vuitton', 'Dior', 'Chanel', 'Gucci', 'Prada', 'Versace',
    // Smartwatches
    'Apple Watch', 'Samsung Galaxy Watch', 'Garmin', 'Fitbit', 'Polar', 'Suunto', 'Withings',
    // Vintage & Nischen
    'Heuer', 'Universal Genève', 'Movado', 'Bulova', 'Timex', 'Swatch', 'Fossil', 'Michael Kors', 'Daniel Wellington', 'MVMT'
  ],

  // HANDY, TELEFON & FUNK
  'handy-telefon': [
    // Smartphones
    'Apple', 'iPhone', 'Samsung', 'Google', 'Pixel', 'Huawei', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Honor', 'Motorola', 'Nokia', 'Sony', 'Sony Xperia', 'LG', 'Asus', 'Zenfone', 'Rog Phone', 'BlackBerry', 'Fairphone', 'Nothing Phone',
    // Tablets
    'iPad', 'Samsung Galaxy Tab', 'Microsoft Surface', 'Lenovo Tab', 'Huawei MatePad',
    // Telefone
    'Panasonic', 'Gigaset', 'Snom', 'Yealink', 'Poly', 'Jabra'
  ],

  // COMPUTER & NETZWERK
  'computer-netzwerk': [
    // Laptops
    'Apple', 'MacBook', 'Dell', 'HP', 'Lenovo', 'ThinkPad', 'Asus', 'Acer', 'MSI', 'Razer', 'Alienware', 'Microsoft Surface', 'Samsung', 'LG', 'Fujitsu', 'Toshiba', 'Sony VAIO',
    // Desktop PCs
    'Apple', 'iMac', 'Mac Pro', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Alienware', 'Corsair', 'NZXT',
    // Monitore
    'Samsung', 'LG', 'Dell', 'HP', 'Asus', 'Acer', 'BenQ', 'AOC', 'ViewSonic', 'Philips', 'Eizo', 'NEC', 'Acer Predator', 'ASUS ROG',
    // Drucker
    'HP', 'Canon', 'Epson', 'Brother', 'Xerox', 'Lexmark', 'Ricoh', 'Konica Minolta', 'Kyocera',
    // Netzwerk
    'Cisco', 'Netgear', 'TP-Link', 'Linksys', 'D-Link', 'ASUS', 'Ubiquiti', 'MikroTik', 'FritzBox', 'AVM',
    // Tastaturen & Mäuse
    'Logitech', 'Corsair', 'Razer', 'SteelSeries', 'HyperX', 'Roccat', 'Cooler Master', 'Keychron', 'Ducky', 'Das Keyboard', 'Cherry', 'Microsoft', 'Apple Magic Keyboard'
  ],

  // FOTO & OPTIK
  'foto-optik': [
    // Kameras
    'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus', 'Panasonic', 'Leica', 'Pentax', 'Hasselblad', 'Phase One', 'Mamiya', 'Bronica',
    // Objektive
    'Canon EF', 'Canon RF', 'Nikon F', 'Nikon Z', 'Sony E', 'Sony FE', 'Sigma', 'Tamron', 'Tokina', 'Zeiss', 'Voigtländer', 'Laowa',
    // Drohnen
    'DJI', 'Parrot', 'Autel', 'Skydio', 'Yuneec',
    // Action Cams
    'GoPro', 'DJI Osmo', 'Insta360', 'Sony Action Cam',
    // Zubehör
    'Manfrotto', 'Gitzo', 'Joby', 'Peak Design', 'Lowepro', 'Think Tank', 'Blackmagic', 'Atomos'
  ],

  // SPORT
  'sport': [
    // Fahrräder
    'Trek', 'Specialized', 'Canyon', 'Scott', 'Cube', 'Giant', 'Cannondale', 'Bianchi', 'Pinarello', 'Cervelo', 'Orbea', 'Focus', 'Merida', 'Kona', 'Santa Cruz', 'Yeti', 'Pivot', 'Ibis',
    // E-Bikes
    'Bosch', 'Shimano', 'Yamaha', 'Brose', 'Fazua',
    // Ski & Snowboard
    'Rossignol', 'Atomic', 'Salomon', 'K2', 'Volkl', 'Head', 'Fischer', 'Dynastar', 'Elan', 'Line', 'Burton', 'Lib Tech', 'Gnu', 'Never Summer',
    // Fitness
    'Technogym', 'Life Fitness', 'Precor', 'Matrix', 'NordicTrack', 'Bowflex', 'Peloton',
    // Lauf & Outdoor
    'Garmin', 'Suunto', 'Polar', 'Coros', 'Salomon', 'Hoka', 'Brooks', 'Asics', 'Nike Running', 'Adidas Running', 'New Balance', 'Saucony',
    // Wassersport
    'Quiksilver', 'Rip Curl', 'Billabong', 'O\'Neill', 'Patagonia', 'North Face'
  ],

  // KLEIDUNG & ACCESSOIRES
  'kleidung-accessoires': [
    // Luxus
    'Gucci', 'Prada', 'Louis Vuitton', 'Hermès', 'Chanel', 'Dior', 'Versace', 'Dolce & Gabbana', 'Armani', 'Giorgio Armani', 'Emporio Armani', 'Balenciaga', 'Saint Laurent', 'Yves Saint Laurent', 'Givenchy', 'Fendi', 'Bottega Veneta', 'Loewe', 'Celine', 'Burberry', 'Valentino', 'Tom Ford', 'Alexander McQueen', 'Stella McCartney',
    // Premium
    'Hugo Boss', 'Ralph Lauren', 'Polo Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Lacoste', 'Fred Perry', 'Stone Island', 'Moncler', 'Canada Goose', 'Moose Knuckles', 'The North Face', 'Patagonia', 'Arc\'teryx',
    // Streetwear
    'Supreme', 'Off-White', 'Bape', 'Palace', 'Stüssy', 'Carhartt', 'Dickies', 'Vans', 'Converse',
    // Sneaker
    'Nike', 'Adidas', 'Jordan', 'Air Jordan', 'New Balance', 'Puma', 'Reebok', 'Asics', 'Onitsuka Tiger', 'Vans', 'Converse', 'Yeezy', 'Balenciaga Triple S', 'Golden Goose',
    // Schweizer Marken
    'Bally', 'Akris', 'Zegna', 'Ermenegildo Zegna'
  ],

  // HAUSHALT & WOHNEN
  'haushalt-wohnen': [
    // Möbel
    'IKEA', 'Vitra', 'Kartell', 'Cassina', 'B&B Italia', 'Poltrona Frau', 'Knoll', 'Herman Miller', 'Steelcase', 'Flötotto', 'USM', 'Rolf Benz', 'Ligne Roset', 'Roche Bobois',
    // Küche
    'Miele', 'Bosch', 'Siemens', 'Gaggenau', 'V-Zug', 'Küppersbusch', 'AEG', 'Electrolux', 'Whirlpool', 'Samsung', 'LG', 'Smeg', 'De\'Longhi', 'Nespresso', 'Jura', 'Schaerer', 'WMF', 'Zwilling', 'Fissler', 'Le Creuset', 'Staub',
    // Staubsauger
    'Dyson', 'Miele', 'Vorwerk', 'Sebo', 'Rowenta', 'Philips', 'Shark', 'Bissell',
    // Waschmaschinen
    'Miele', 'Bosch', 'Siemens', 'AEG', 'Electrolux', 'Whirlpool', 'Samsung', 'LG', 'Candy', 'Beko'
  ],

  // HANDWERK & GARTEN
  'handwerk-garten': [
    // Werkzeug
    'Bosch', 'Bosch Professional', 'Makita', 'DeWalt', 'Milwaukee', 'Festool', 'Hilti', 'Metabo', 'Einhell', 'Ryobi', 'Black+Decker', 'Stanley', 'Wera', 'Wiha', 'Knipex', 'Gedore', 'Bahco', 'Snap-on',
    // Garten
    'Stihl', 'Husqvarna', 'Gardena', 'Wolf-Garten', 'Fiskars', 'Güde', 'Einhell', 'Makita', 'Bosch',
    // Grill
    'Weber', 'Napoleon', 'Broil King', 'Char-Broil', 'Big Green Egg', 'Kamado Joe'
  ],

  // GAMES & KONSOLEN
  'games-konsolen': [
    // Konsolen
    'PlayStation', 'PS5', 'PS4', 'Xbox', 'Xbox Series X', 'Xbox Series S', 'Nintendo', 'Nintendo Switch', 'Steam Deck',
    // Gaming PCs
    'Alienware', 'Razer', 'ASUS ROG', 'MSI', 'Corsair', 'NZXT', 'Origin PC',
    // Zubehör
    'Logitech G', 'Razer', 'SteelSeries', 'HyperX', 'Corsair', 'Astro', 'Turtle Beach', 'Sennheiser', 'Beyerdynamic'
  ],

  // MUSIK & INSTRUMENTE
  'musik-instrumente': [
    // Gitarren
    'Fender', 'Gibson', 'PRS', 'Ibanez', 'Yamaha', 'Epiphone', 'Squier', 'Gretsch', 'Martin', 'Taylor', 'Takamine', 'Cort', 'Schecter', 'Jackson', 'ESP', 'Charvel',
    // Keyboards & Pianos
    'Yamaha', 'Roland', 'Korg', 'Nord', 'Kawai', 'Steinway', 'Bösendorfer', 'Fazioli', 'Bechstein',
    // Drums
    'Pearl', 'Tama', 'DW', 'Drum Workshop', 'Yamaha', 'Ludwig', 'Gretsch', 'Sonor', 'Mapex',
    // Audio
    'Shure', 'Sennheiser', 'Audio-Technica', 'AKG', 'Beyerdynamic', 'Neumann', 'Rode', 'Focusrite', 'Universal Audio', 'Apogee'
  ],

  // FOTO & OPTIK (erweitert)
  'foto-optik': [
    // Kameras (siehe oben)
    'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus', 'Panasonic', 'Leica', 'Pentax', 'Hasselblad', 'Phase One', 'Mamiya', 'Bronica',
    // Objektive (siehe oben)
    'Canon EF', 'Canon RF', 'Nikon F', 'Nikon Z', 'Sony E', 'Sony FE', 'Sigma', 'Tamron', 'Tokina', 'Zeiss', 'Voigtländer', 'Laowa',
    // Drohnen (siehe oben)
    'DJI', 'Parrot', 'Autel', 'Skydio', 'Yuneec',
    // Action Cams (siehe oben)
    'GoPro', 'DJI Osmo', 'Insta360', 'Sony Action Cam',
    // Zubehör (siehe oben)
    'Manfrotto', 'Gitzo', 'Joby', 'Peak Design', 'Lowepro', 'Think Tank', 'Blackmagic', 'Atomos',
    // Ferngläser & Optik
    'Zeiss', 'Leica', 'Swarovski', 'Nikon', 'Canon', 'Steiner', 'Vortex', 'Bushnell', 'Celestron', 'Meade'
  ],

  // KIND & BABY
  'kind-baby': [
    'Bugaboo', 'Stokke', 'Cybex', 'Maxi-Cosi', 'Chicco', 'Peg Perego', 'Uppababy', 'Babyzen', 'Joolz', 'Mountain Buggy', 'Quinny', 'Silver Cross', 'Phil & Teds', 'Thule', 'Britax', 'Recaro', 'BeSafe', 'Diono'
  ],

  // BÜCHER
  'buecher': [
    'Penguin', 'Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan', 'Hachette', 'Scholastic', 'DK', 'Lonely Planet', 'National Geographic'
  ],

  // FILME & SERIEN
  'filme-serien': [
    'Disney', 'Marvel', 'Star Wars', 'Warner Bros', 'Universal', 'Paramount', 'Sony Pictures', '20th Century Fox', 'Lionsgate', 'MGM'
  ],

  // SPIELZEUG & BASTELN
  'spielzeug-basteln': [
    'LEGO', 'Playmobil', 'Mattel', 'Hasbro', 'Fisher-Price', 'Hot Wheels', 'Barbie', 'Nerf', 'Pokémon', 'Funko Pop', 'Bandai', 'Tamagotchi', 'Ravensburger', 'Schleich', 'Sylvanian Families'
  ],

  // MODELLBAU & HOBBY
  'modellbau-hobby': [
    'Märklin', 'Fleischmann', 'Roco', 'Piko', 'Lima', 'Hornby', 'Bachmann', 'Revell', 'Tamiya', 'Airfix', 'Italeri', 'Hasegawa', 'Academy', 'Trumpeter', 'Dragon', 'Miniart'
  ],

  // TIERZUBEHÖR
  'tierzubehoer': [
    'Royal Canin', 'Hill\'s', 'Purina', 'Whiskas', 'Pedigree', 'Iams', 'Eukanuba', 'Acana', 'Orijen', 'Trixie', 'Ferplast', 'Karlie', 'Trixie', 'Flexi', 'Rogz'
  ],

  // WEIN & GENUSS
  'wein-genuss': [
    'Dom Pérignon', 'Moët & Chandon', 'Veuve Clicquot', 'Krug', 'Laurent-Perrier', 'Taittinger', 'Perrier-Jouët', 'Bollinger', 'Ruinart', 'Lanson', 'Nicolas Feuillatte'
  ],

  // BÜRO & GEWERBE
  'buero-gewerbe': [
    'Canon', 'HP', 'Xerox', 'Ricoh', 'Konica Minolta', 'Kyocera', 'Brother', 'Epson', 'Sharp', 'Panasonic', 'Samsung', 'Lexmark'
  ],

  // NEUE KATEGORIEN
  // IMMOBILIEN
  'immobilien': [
    'Immobilien', 'Wohnung', 'Haus', 'Grundstück', 'Eigentumswohnung', 'Mietwohnung', 'Villa', 'Ferienhaus', 'Gewerbeimmobilie'
  ],

  // JOBS & KARRIERE
  'jobs-karriere': [
    // Branchen (keine spezifischen Marken, aber Kategorien)
    'IT', 'Finanz', 'Handel', 'Medizin', 'Recht', 'Ingenieurwesen', 'Marketing', 'Vertrieb', 'HR', 'Personalwesen'
  ],

  // DIENSTLEISTUNGEN
  'dienstleistungen': [
    // Service-Anbieter (keine spezifischen Marken)
    'Handwerk', 'Reparatur', 'Reinigung', 'Umzug', 'Garten', 'Beratung', 'Montage', 'Installation'
  ],

  // CAMPING & OUTDOOR
  'camping-outdoor': [
    'Coleman', 'Quechua', 'The North Face', 'Patagonia', 'Arc\'teryx', 'Mammut', 'Salomon', 'Deuter', 'Osprey', 'Gregory', 'Fjällräven', 'Jack Wolfskin', 'Vaude', 'Bergans', 'Haglöfs', 'Marmot', 'Mountain Hardwear', 'Black Diamond', 'Petzl', 'MSR', 'Big Agnes', 'Nemo', 'Therm-a-Rest', 'Sea to Summit', 'Jetboil', 'Primus', 'Trangia'
  ],

  // WELLNESS & GESUNDHEIT
  'wellness-gesundheit': [
    'Beurer', 'HoMedics', 'Medisana', 'Therabody', 'Theragun', 'Hyperice', 'Nekteck', 'Renpho', 'Sharper Image', 'Snailax', 'Naipo', 'Zyllion', 'Lifepro', 'Klarus', 'Infinity', 'Kastking', 'Harvia', 'KLAFS', 'Tylo', 'Helo', 'Finnleo'
  ],

  // REISE & URLAUB
  'reise-urlaub': [
    'Samsonite', 'Rimowa', 'Tumi', 'Victorinox', 'Travelpro', 'Briggs & Riley', 'Delsey', 'Hartmann', 'Away', 'Calpak', 'Lonely Planet', 'Rough Guides', 'DK Eyewitness', 'Fodor\'s', 'Frommer\'s', 'Rick Steves'
  ],

  // GARTEN & PFLANZEN
  'garten-pflanzen': [
    'Gardena', 'Wolf-Garten', 'Fiskars', 'Güde', 'Einhell', 'Makita', 'Bosch', 'Stihl', 'Husqvarna', 'Black & Decker', 'Ryobi', 'DeWalt', 'Milwaukee', 'Festool', 'Gardman', 'Westland', 'Compo', 'Neudorff', 'Bioland', 'Floragard'
  ],

  // BOOTE & SCHIFFE
  'boote-schiffe': [
    'Bavaria', 'Beneteau', 'Jeanneau', 'Dufour', 'Hanse', 'Sunseeker', 'Princess', 'Fairline', 'Azimut', 'Ferretti', 'Riva', 'Pershing', 'Itama', 'Wally', 'Lürssen', 'Feadship', 'Oceanco', 'Amels', 'Perini Navi', 'Oyster', 'Hallberg-Rassy', 'Najad', 'X-Yachts', 'J/Boats', 'Catalina', 'Hunter', 'Pearson', 'C&C', 'Swan', 'Nautor'
  ],

  // TIERE
  'tiere': [
    // Tierrassen (keine Marken, aber Kategorien)
    'Golden Retriever', 'Labrador', 'Deutscher Schäferhund', 'Französische Bulldogge', 'Mops', 'Dackel', 'Beagle', 'Rottweiler', 'Boxer', 'Bernhardiner', 'Perser', 'Maine Coon', 'Britisch Kurzhaar', 'Ragdoll', 'Siamkatze', 'Norwegische Waldkatze', 'Bengal', 'Abessinier'
  ],

  // LEBENSMITTEL
  'lebensmittel': [
    'Bio', 'Demeter', 'Bioland', 'Naturland', 'Alnatura', 'Rapunzel', 'Bauck', 'Gepa', 'Rapunzel', 'Allos', 'Holle', 'Lebensbaum', 'Sonett', 'Weleda', 'Dr. Hauschka', 'Lavera', 'Alverde', 'Balea'
  ],

  // MEDIZIN & GESUNDHEIT
  'medizin-gesundheit': [
    'Beurer', 'Medisana', 'Omron', 'Braun', 'Philips', 'Withings', 'iHealth', 'Sanitas', 'Hartmann', 'Löwenstein', 'ResMed', 'Fisher & Paykel', 'Invacare', 'Sunrise Medical', 'Permobil', 'Quickie', 'Ottobock', 'Medline', 'Drive Medical'
  ],

  // FLUGZEUGE
  'flugzeuge': [
    'Cessna', 'Piper', 'Beechcraft', 'Mooney', 'Cirrus', 'Diamond', 'Robin', 'Socata', 'Extra', 'Pitts', 'Aerobatic', 'Grumman', 'Bellanca', 'Stinson', 'Aeronca', 'Taylorcraft', 'Luscombe', 'Ercoupe', 'Navion', 'Bonanza', 'Baron', 'King Air', 'Citation', 'Gulfstream', 'Bombardier', 'Dassault', 'Embraer', 'Pilatus', 'Diamond Aircraft', 'Cirrus Aircraft'
  ],

  // SMART HOME
  'smart-home': [
    'Philips Hue', 'LIFX', 'Nanoleaf', 'Govee', 'Yeelight', 'TP-Link Kasa', 'Wiz', 'Sengled', 'Cree', 'Sylvania', 'GE', 'C by GE', 'Amazon Echo', 'Google Nest', 'Apple HomeKit', 'Samsung SmartThings', 'Hubitat', 'Home Assistant', 'OpenHAB', 'Fibaro', 'Z-Wave', 'Zigbee', 'Lutron', 'Insteon', 'Control4', 'Crestron', 'Savant', 'Elan', 'RTI', 'URC'
  ],

  // ELEKTROGERÄTE
  'elektrogeraete': [
    'Miele', 'Bosch', 'Siemens', 'Gaggenau', 'V-Zug', 'Küppersbusch', 'AEG', 'Electrolux', 'Whirlpool', 'Samsung', 'LG', 'Smeg', 'De\'Longhi', 'Nespresso', 'Jura', 'Schaerer', 'WMF', 'Zwilling', 'Fissler', 'Le Creuset', 'Staub', 'KitchenAid', 'Kenwood', 'Magimix', 'Thermomix', 'Vitamix', 'Blendtec', 'Breville', 'Cuisinart', 'Tefal', 'Krups', 'Braun', 'Philips', 'Rowenta', 'Dyson', 'Vorwerk', 'Sebo', 'Shark', 'Bissell'
  ],

  // BAUSTOFFE
  'baustoffe': [
    'Knauf', 'Rigips', 'Saint-Gobain', 'Isover', 'Rockwool', 'Ursa', 'Paroc', 'Kingspan', 'Recticel', 'Foamglas', 'Baumit', 'Weber', 'Sika', 'Mapei', 'Ardex', 'Uzin', 'Bostik', 'Henkel', '3M', 'Tesa', 'Illbruck', 'Pro Clima', 'Gutex', 'Pavatex', 'Steico', 'Gutex', 'Homatherm', 'Isocell', 'Heraklith', 'Multipor'
  ],

  // KUNST & HANDWERK
  'kunst-handwerk': [
    'Winsor & Newton', 'Schmincke', 'Rembrandt', 'Old Holland', 'Sennelier', 'Liquitex', 'Golden', 'Daniel Smith', 'Holbein', 'M. Graham', 'Da Vinci', 'Rosemary & Co', 'Escoda', 'Raphael', 'Princeton', 'Silver Brush', 'Isabey', 'Langnickel', 'Faber-Castell', 'Staedtler', 'Derwent', 'Prismacolor', 'Caran d\'Ache', 'Koh-I-Noor', 'Pentel', 'Sakura', 'Uni-ball', 'Pilot', 'Zebra', 'Tombow'
  ]
}

// Alle Marken in einem Array für allgemeine Suche
export const allBrands = Object.values(brandsByCategory).flat()

// Marken nach Kategorie abrufen
export function getBrandsForCategory(category: string): string[] {
  if (!category) return []
  return brandsByCategory[category] || []
}

// Marken suchen (case-insensitive)
export function searchBrands(query: string, category?: string): string[] {
  if (!query) return []
  const brands = category ? getBrandsForCategory(category) : allBrands
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return brands
  return brands.filter(brand => brand.toLowerCase().includes(lowerQuery))
}

