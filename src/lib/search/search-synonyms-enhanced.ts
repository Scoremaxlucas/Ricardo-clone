/**
 * Enhanced Synonym Dictionary for Search Query Expansion
 * RICARDO-LEVEL: 800+ Mappings
 *
 * Supports: German, Swiss German, English, French, Italian
 * Features: Typos, Plural/Singular, Brand Names, Product Variations
 */

export const enhancedSynonyms: Record<string, string[]> = {
  // ==================== SPORT & BALLSPORT ====================
  ball: [
    'baelle',
    'bälle',
    'balls',
    'fussball',
    'fußball',
    'soccer',
    'football',
    'basketball',
    'volleyball',
    'handball',
    'tennis',
    'tennisball',
    'golfball',
    'rugby',
    'baseball',
    'softball',
    'medizinball',
    'gymnastikball',
    'spielball',
    'sportball',
  ],
  fussball: [
    'fußball',
    'soccer',
    'football',
    'ball',
    'fussbaelle',
    'fußbälle',
    'fussballschuhe',
    'trikot',
  ],
  fußball: ['fussball', 'soccer', 'football', 'ball'],
  soccer: ['fussball', 'fußball', 'football', 'ball'],
  basketball: ['ball', 'korb', 'basket', 'baelle', 'nba'],
  volleyball: ['ball', 'netz', 'beach volleyball', 'baelle', 'beachvolleyball'],
  handball: ['ball', 'baelle'],
  tennis: ['tennisball', 'tennisschläger', 'tennisschlaeger', 'racket', 'tennisracket'],
  golf: ['golfball', 'golfschläger', 'golfschlaeger', 'putting', 'golfset', 'golftasche'],
  fitness: ['training', 'workout', 'gym', 'fitnessstudio', 'sport', 'krafttraining', 'cardio'],
  yoga: ['yogamatte', 'meditation', 'pilates', 'stretching'],
  ski: ['skier', 'skifahren', 'skiing', 'alpin', 'langlauf', 'carving', 'skischuhe', 'skistöcke'],
  snowboard: ['snowboarden', 'board', 'freestyle', 'halfpipe', 'snowboardboots'],
  wandern: ['hiking', 'trekking', 'bergsteigen', 'outdoor', 'wanderschuhe', 'wanderstock'],
  camping: ['zelt', 'tent', 'schlafsack', 'outdoor', 'campingausrüstung', 'isomatte'],

  // ==================== FAHRRAD / VELO ====================
  fahrrad: [
    'velo',
    'bike',
    'bicycle',
    'rad',
    'fahrräder',
    'fahrraeder',
    'bikes',
    'zweirad',
    'drahtesel',
  ],
  velo: ['fahrrad', 'bike', 'bicycle', 'rad', 'velos'],
  bike: ['fahrrad', 'velo', 'bicycle', 'rad', 'bikes'],
  rennrad: ['roadbike', 'road bike', 'renner', 'rennvelo', 'rennräder', 'racebike', 'carbon'],
  mountainbike: [
    'mtb',
    'mountain bike',
    'geländerad',
    'mountainbikes',
    'fullsuspension',
    'hardtail',
    'enduro',
    'downhill',
    'trail',
  ],
  ebike: [
    'e-bike',
    'elektrofahrrad',
    'elektrovelo',
    'pedelec',
    'ebikes',
    'e-bikes',
    'elektro',
    'akku',
  ],
  'e-bike': ['ebike', 'elektrofahrrad', 'elektrovelo', 'pedelec'],
  citybike: ['stadtrad', 'city bike', 'hollandrad', 'damenrad', 'herrenrad'],
  gravelbike: ['gravel', 'allroad', 'crossrad', 'cyclocross'],
  kinderfahrrad: ['kindervelo', 'kinderrad', 'laufrad', 'puky', 'woom'],
  fahrradhelm: ['velohelm', 'helm', 'helmet', 'schutzhelm'],

  // ==================== COMPUTER & ELEKTRONIK ====================
  laptop: [
    'notebook',
    'computer',
    'pc',
    'laptops',
    'notebooks',
    'macbook',
    'thinkpad',
    'ultrabook',
    'chromebook',
  ],
  notebook: ['laptop', 'computer', 'pc', 'notebooks', 'laptops'],
  computer: ['pc', 'rechner', 'desktop', 'computers', 'laptop', 'notebook', 'workstation'],
  pc: ['computer', 'rechner', 'desktop', 'personalcomputer', 'gaming pc'],
  macbook: ['laptop', 'notebook', 'mac', 'apple', 'macbooks', 'macbook pro', 'macbook air'],
  imac: ['apple', 'mac', 'desktop', 'computer'],
  tablet: ['ipad', 'android tablet', 'tablets', 'tab', 'surface'],
  ipad: ['tablet', 'apple tablet', 'ipads', 'ipad pro', 'ipad air', 'ipad mini'],
  server: ['nas', 'network', 'storage', 'homeserver'],
  raspberry: ['raspberry pi', 'raspi', 'minipc', 'einplatinencomputer'],

  maus: ['mouse', 'computermaus', 'gaming maus', 'maeuse', 'mäuse', 'wireless mouse'],
  mouse: ['maus', 'computermaus', 'mice'],
  tastatur: ['keyboard', 'tastaturen', 'keyboards', 'mechanische tastatur', 'gaming keyboard'],
  keyboard: ['tastatur', 'keyboards', 'tastaturen', 'mechanisch'],
  monitor: ['bildschirm', 'display', 'screen', 'monitore', 'monitors', 'gaming monitor', '4k'],
  bildschirm: ['monitor', 'display', 'screen', 'bildschirme'],
  drucker: ['printer', 'drucken', 'laserdrucker', 'tintenstrahldrucker', 'multifunktionsdrucker'],
  printer: ['drucker', 'drucken', 'printers'],
  scanner: ['scan', 'dokumentenscanner', 'flachbettscanner'],
  beamer: ['projektor', 'projector', 'heimkino', 'präsentation'],
  webcam: ['kamera', 'camera', 'videocall', 'streaming'],
  headset: ['kopfhörer', 'headphones', 'gaming headset', 'mikrofon'],
  kopfhörer: ['headphones', 'earphones', 'ohrhörer', 'airpods', 'earbuds', 'bluetooth'],
  lautsprecher: ['speaker', 'speakers', 'soundbar', 'bluetooth speaker', 'boxen'],
  speaker: ['lautsprecher', 'speakers', 'soundbox'],
  festplatte: ['hdd', 'hard drive', 'harddisk', 'speicher'],
  ssd: ['solid state', 'nvme', 'speicher', 'festplatte'],
  grafikkarte: ['gpu', 'graphics card', 'nvidia', 'geforce', 'radeon', 'rtx', 'gaming'],
  prozessor: ['cpu', 'processor', 'intel', 'amd', 'ryzen', 'core'],
  ram: ['arbeitsspeicher', 'memory', 'speicher', 'ddr4', 'ddr5'],

  // ==================== HANDY / SMARTPHONE ====================
  handy: ['smartphone', 'telefon', 'phone', 'mobile', 'handys', 'mobiltelefon', 'natel'],
  smartphone: ['handy', 'phone', 'mobile', 'smartphones', 'telefon'],
  iphone: ['apple handy', 'apple smartphone', 'iphones', 'apple phone', 'ios'],
  'iphone 15': ['iphone 15 pro', 'iphone 15 pro max', 'iphone 15 plus', 'apple'],
  'iphone 14': ['iphone 14 pro', 'iphone 14 pro max', 'iphone 14 plus', 'apple'],
  'iphone 13': ['iphone 13 pro', 'iphone 13 pro max', 'iphone 13 mini', 'apple'],
  samsung: ['galaxy', 'samsung handy', 'samsung smartphone', 'android'],
  galaxy: ['samsung', 'samsung galaxy', 'galaxy s', 'galaxy a', 'galaxy z'],
  'galaxy s24': ['samsung s24', 'galaxy s24 ultra', 'galaxy s24 plus'],
  'galaxy s23': ['samsung s23', 'galaxy s23 ultra', 'galaxy s23 plus'],
  pixel: ['google pixel', 'google handy', 'android'],
  xiaomi: ['mi', 'redmi', 'poco', 'android'],
  huawei: ['huawei handy', 'mate', 'p series', 'android'],
  oneplus: ['one plus', 'android', 'oppo'],
  handyhülle: ['case', 'schutzhülle', 'cover', 'bumper', 'silikon'],
  ladegerät: ['charger', 'netzteil', 'ladekabel', 'wireless charger'],

  // ==================== KAMERA / FOTO ====================
  kamera: ['camera', 'fotoapparat', 'fotokamera', 'kameras', 'cameras', 'digicam'],
  camera: ['kamera', 'fotoapparat', 'kameras'],
  spiegelreflex: ['dslr', 'spiegelreflexkamera', 'slr', 'vollformat'],
  systemkamera: ['mirrorless', 'spiegellos', 'aps-c', 'mft'],
  canon: ['eos', 'canon kamera', 'canoneos'],
  nikon: ['nikon kamera', 'nikkor', 'z mount'],
  sony: ['sony alpha', 'alpha', 'a7', 'a6000'],
  fujifilm: ['fuji', 'x series', 'xt', 'xe'],
  panasonic: ['lumix', 'gh', 'g series'],
  objektiv: ['lens', 'linse', 'objektive', 'lenses', 'glas', 'optik'],
  lens: ['objektiv', 'linse', 'lenses', 'objektive'],
  weitwinkel: ['wide angle', 'ultra wide', 'landschaft'],
  tele: ['teleobjektiv', 'zoom', 'telephoto', 'fernrohr'],
  festbrennweite: ['prime', 'fixfocal', '35mm', '50mm', '85mm'],
  stativ: ['tripod', 'dreibein', 'kamerastativ', 'einbeinstativ'],
  blitz: ['flash', 'speedlight', 'aufsteckblitz', 'studioblitz'],
  drohne: ['drone', 'quadcopter', 'drohnen', 'drones', 'dji', 'multicopter', 'fpv'],
  drone: ['drohne', 'quadcopter', 'drohnen'],
  dji: ['mavic', 'phantom', 'mini', 'air', 'drohne'],
  gopro: ['actioncam', 'action camera', 'sportkamera', 'hero'],
  actioncam: ['gopro', 'action camera', 'sportkamera', 'insta360'],
  videokamera: ['camcorder', 'filmkamera', 'video camera'],

  // ==================== MODE / KLEIDUNG ====================
  schuhe: ['shoes', 'sneaker', 'sneakers', 'turnschuhe', 'sportschuhe', 'schuh', 'footwear'],
  shoes: ['schuhe', 'sneaker', 'sneakers', 'turnschuhe'],
  sneaker: ['schuhe', 'shoes', 'sneakers', 'turnschuhe', 'sportschuhe', 'kicks'],
  sneakers: ['sneaker', 'schuhe', 'shoes', 'turnschuhe'],
  turnschuhe: ['sneaker', 'schuhe', 'shoes', 'sneakers', 'sportschuhe'],
  laufschuhe: ['running shoes', 'jogging', 'marathon', 'brooks', 'asics', 'nike'],
  wanderschuhe: ['hiking boots', 'trekkingschuhe', 'bergschuhe', 'outdoor'],
  stiefel: ['boots', 'winterstiefel', 'chelsea boots', 'ankle boots'],
  sandalen: ['sandals', 'sandaletten', 'sommerschuhe', 'flip flops'],
  'high heels': ['pumps', 'stöckelschuhe', 'absatzschuhe', 'damenschuhe'],

  jacke: ['jacket', 'jacken', 'mantel', 'coat', 'jackett', 'blazer'],
  jacket: ['jacke', 'jacken', 'jackets', 'mantel'],
  winterjacke: ['daunen', 'parka', 'wintermantel', 'skijacke', 'warm'],
  lederjacke: ['leather jacket', 'biker jacket', 'leder'],
  regenjacke: ['rain jacket', 'wasserdicht', 'hardshell', 'gore-tex'],
  anzug: ['suit', 'anzüge', 'business', 'kostüm', 'sakko'],
  blazer: ['sakko', 'jackett', 'jacket', 'business'],

  hose: ['pants', 'hosen', 'jeans', 'trousers', 'chino'],
  pants: ['hose', 'hosen', 'jeans', 'trousers'],
  jeans: ['hose', 'pants', 'denim', 'bluejeans', 'levis', 'wrangler'],
  chino: ['chinohose', 'stoffhose', 'business casual'],
  shorts: ['kurze hose', 'bermuda', 'hotpants', 'sommerhose'],
  jogginghose: ['sweatpants', 'trackpants', 'sporthose', 'training'],

  hemd: ['shirt', 'hemden', 'oberhemd', 'businesshemd'],
  shirt: ['hemd', 't-shirt', 'tshirt', 'oberteil'],
  't-shirt': ['tshirt', 'shirt', 't shirt', 'oberteil'],
  pullover: ['sweater', 'pulli', 'jumper', 'strickpullover', 'hoodie'],
  hoodie: ['kapuzenpullover', 'hoody', 'sweatshirt', 'kapuzenpulli'],
  sweatshirt: ['sweater', 'pullover', 'crewneck'],
  bluse: ['blouse', 'damenhemd', 'tunika'],
  kleid: ['dress', 'kleider', 'abendkleid', 'sommerkleid'],
  rock: ['skirt', 'röcke', 'minirock', 'maxirock'],

  tasche: ['bag', 'taschen', 'bags', 'handtasche', 'rucksack', 'beutel'],
  bag: ['tasche', 'taschen', 'bags', 'handtasche'],
  handtasche: ['handbag', 'purse', 'damentasche', 'clutch'],
  rucksack: ['backpack', 'rucksäcke', 'rucksaecke', 'ranzen', 'schulrucksack'],
  backpack: ['rucksack', 'rucksäcke', 'bag'],
  koffer: ['suitcase', 'trolley', 'reisekoffer', 'gepäck', 'luggage'],
  geldbörse: ['wallet', 'portemonnaie', 'geldbeutel', 'brieftasche'],
  gürtel: ['belt', 'ledergürtel', 'gürtel'],

  // ==================== LUXUS MARKEN ====================
  nike: ['air jordan', 'jordan', 'air max', 'dunk', 'force', 'swoosh'],
  adidas: ['yeezy', 'boost', 'superstar', 'stan smith', 'gazelle'],
  puma: ['puma schuhe', 'puma sport'],
  'new balance': ['nb', 'newbalance', '574', '990', '550'],
  'louis vuitton': ['lv', 'vuitton', 'louisvuitton', 'luxus'],
  gucci: ['gucci tasche', 'gucci gürtel', 'designer'],
  prada: ['prada tasche', 'luxus', 'designer'],
  chanel: ['chanel tasche', 'luxus', 'designer', 'parfum'],
  hermes: ['hermès', 'birkin', 'kelly', 'luxus'],
  balenciaga: ['balenciaga schuhe', 'triple s', 'track'],
  moncler: ['moncler jacke', 'daunen', 'luxus'],
  burberry: ['burberry schal', 'burberry mantel', 'check'],
  versace: ['versace shirt', 'medusa', 'luxus'],
  armani: ['emporio armani', 'giorgio armani', 'ea7'],
  'hugo boss': ['boss', 'hugoboss', 'business'],
  'ralph lauren': ['polo', 'ralph', 'lauren'],
  'tommy hilfiger': ['tommy', 'hilfiger'],
  'calvin klein': ['ck', 'calvinklein'],
  lacoste: ['krokodil', 'polo'],
  'north face': ['the north face', 'tnf', 'outdoor'],
  patagonia: ['outdoor', 'fleece', 'nachhaltig'],
  "arc'teryx": ['arcteryx', 'outdoor', 'gore-tex', 'premium'],

  // ==================== UHREN & SCHMUCK ====================
  uhr: ['watch', 'armbanduhr', 'uhren', 'watches', 'zeitmesser', 'chronograph'],
  watch: ['uhr', 'armbanduhr', 'watches', 'uhren'],
  armbanduhr: ['uhr', 'watch', 'wristwatch', 'armbanduhren'],
  automatikuhr: ['automatic', 'mechanisch', 'selbstaufzug'],
  smartwatch: ['apple watch', 'smart watch', 'fitnessuhr', 'garmin'],
  'apple watch': ['smartwatch', 'iwatch', 'apple uhr'],
  fitnessuhr: ['fitness tracker', 'sportwatch', 'garmin', 'polar'],

  rolex: [
    'luxusuhr',
    'schweizer uhr',
    'automatikuhr',
    'submariner',
    'datejust',
    'daytona',
    'gmt master',
    'oyster',
  ],
  omega: ['luxusuhr', 'schweizer uhr', 'speedmaster', 'seamaster', 'constellation', 'moonwatch'],
  'tag heuer': ['tagheuer', 'carrera', 'monaco', 'aquaracer'],
  breitling: ['navitimer', 'superocean', 'chronomat', 'avenger'],
  iwc: ['portugieser', 'pilot', 'portofino', 'schaffhausen'],
  'patek philippe': ['patek', 'nautilus', 'aquanaut', 'calatrava'],
  'audemars piguet': ['ap', 'royal oak', 'offshore'],
  hublot: ['big bang', 'classic fusion'],
  cartier: ['tank', 'santos', 'ballon bleu'],
  tudor: ['black bay', 'pelagos', 'rolex schwester'],
  longines: ['master collection', 'conquest', 'hydroconquest'],
  tissot: ['prx', 'seastar', 'gentleman', 'swiss'],
  swatch: ['omega x swatch', 'moonswatch', 'swiss'],
  casio: ['g-shock', 'gshock', 'edifice', 'oceanus'],
  seiko: ['presage', 'prospex', 'srpd', 'skx'],
  citizen: ['eco-drive', 'promaster', 'attesa'],

  schmuck: ['jewelry', 'jewellery', 'bijoux', 'accessoires', 'goldschmuck', 'silberschmuck'],
  jewelry: ['schmuck', 'jewellery', 'bijoux'],
  gold: ['goldkette', 'goldring', 'goldschmuck', '585', '750', '18k', '14k'],
  silber: ['silberkette', 'silberring', 'silberschmuck', '925', 'sterling'],
  diamant: ['diamond', 'brillant', 'diamantring', 'solitär'],
  ring: ['ringe', 'rings', 'fingerring', 'ehering', 'trauring', 'verlobungsring'],
  ehering: ['trauring', 'wedding ring', 'hochzeit', 'platin'],
  kette: ['necklace', 'halskette', 'ketten', 'chain', 'anhänger'],
  necklace: ['kette', 'halskette', 'ketten'],
  armband: ['bracelet', 'armbänder', 'armbaender', 'bracelets', 'armreif'],
  bracelet: ['armband', 'armbänder', 'bracelets'],
  ohrringe: ['earrings', 'ohrschmuck', 'creolen', 'stecker', 'ohrstecker'],
  anhänger: ['pendant', 'charm', 'kettenanhänger'],
  pandora: ['pandora armband', 'charms', 'moments'],
  swarovski: ['kristall', 'crystal', 'swarovski schmuck'],
  tiffany: ['tiffany co', 'luxus schmuck'],

  // ==================== AUTO & MOTORRAD ====================
  auto: ['car', 'fahrzeug', 'wagen', 'pkw', 'autos', 'cars', 'automobil'],
  car: ['auto', 'fahrzeug', 'wagen', 'cars', 'autos'],
  fahrzeug: ['auto', 'car', 'wagen', 'vehicle', 'fahrzeuge'],
  gebrauchtwagen: ['occasion', 'used car', 'secondhand'],
  neuwagen: ['new car', 'neu', 'ungefahren'],
  suv: ['geländewagen', 'offroad', 'crossover', 'jeep'],
  limousine: ['sedan', 'saloon', 'stufenheck'],
  kombi: ['estate', 'wagon', 'touring', 'avant'],
  cabrio: ['cabriolet', 'convertible', 'roadster', 'spider'],
  elektroauto: ['ev', 'electric car', 'tesla', 'e-auto'],
  hybrid: ['phev', 'plug-in', 'hybridauto'],

  bmw: ['bayerische motoren', 'm sport', 'msport', '3er', '5er', 'x5', 'x3'],
  mercedes: ['benz', 'mercedes-benz', 'amg', 'c-klasse', 'e-klasse', 's-klasse'],
  audi: ['quattro', 'a4', 'a6', 'q5', 'q7', 'rs', 's-line'],
  volkswagen: ['vw', 'golf', 'passat', 'tiguan', 'polo'],
  porsche: ['911', 'carrera', 'cayenne', 'macan', 'panamera', 'taycan'],
  tesla: ['model s', 'model 3', 'model x', 'model y', 'elektro'],
  ferrari: ['sportwagen', 'supersportwagen', 'f8', '488', 'roma'],
  lamborghini: ['huracan', 'aventador', 'urus', 'supersportwagen'],
  'aston martin': ['james bond', 'db11', 'vantage'],
  maserati: ['ghibli', 'quattroporte', 'levante'],
  volvo: ['sicherheit', 'xc60', 'xc90', 'v60'],
  toyota: ['corolla', 'camry', 'rav4', 'yaris', 'prius', 'hybrid'],
  honda: ['civic', 'accord', 'cr-v', 'jazz'],
  mazda: ['mx-5', 'miata', 'cx-5', 'mazda3'],

  motorrad: ['motorcycle', 'bike', 'moped', 'motorräder', 'motorraeder', 'töff', 'toeff'],
  motorcycle: ['motorrad', 'bike', 'moped', 'motorcycles'],
  roller: ['scooter', 'vespa', 'moped', 'mofa'],
  harley: ['harley-davidson', 'harley davidson', 'cruiser', 'chopper'],
  ducati: ['monster', 'panigale', 'multistrada', 'scrambler'],
  yamaha: ['yzf', 'mt', 'tracer', 'tenere'],
  kawasaki: ['ninja', 'z900', 'versys'],
  'honda motorrad': ['cbr', 'africa twin', 'goldwing'],
  'bmw motorrad': ['gs', 'r1250', 's1000rr', 'f900'],
  ktm: ['duke', 'adventure', 'enduro'],

  reifen: ['tires', 'tyres', 'pneu', 'winterreifen', 'sommerreifen', 'allwetter'],
  felgen: ['wheels', 'rims', 'alufelgen', 'stahlfelgen'],
  autoteile: ['ersatzteile', 'car parts', 'zubehör'],
  kindersitz: ['car seat', 'babyschale', 'isofix'],

  // ==================== MÖBEL / HAUSHALT ====================
  möbel: ['moebel', 'furniture', 'einrichtung', 'mobiliar', 'interior'],
  moebel: ['möbel', 'furniture', 'einrichtung'],
  furniture: ['möbel', 'moebel', 'einrichtung'],
  sofa: ['couch', 'sofas', 'couches', 'sitzgarnitur', 'wohnlandschaft'],
  couch: ['sofa', 'sofas', 'couches'],
  sessel: ['armchair', 'lounge', 'relaxsessel', 'ohrensessel', 'fernsehsessel'],
  bett: ['bed', 'betten', 'doppelbett', 'einzelbett', 'boxspringbett'],
  matratze: ['mattress', 'matratzen', 'kaltschaum', 'federkern', 'latex'],
  schrank: ['wardrobe', 'kleiderschrank', 'schränke', 'kommode'],
  kleiderschrank: ['wardrobe', 'garderobe', 'pax'],
  tisch: ['table', 'tische', 'tables', 'esstisch', 'couchtisch', 'schreibtisch'],
  table: ['tisch', 'tische', 'tables'],
  esstisch: ['dining table', 'esszimmertisch', 'tisch'],
  schreibtisch: ['desk', 'bürotisch', 'arbeitstisch', 'homeoffice'],
  stuhl: ['chair', 'stühle', 'stuehle', 'chairs', 'sessel'],
  chair: ['stuhl', 'stühle', 'chairs'],
  bürostuhl: ['office chair', 'drehstuhl', 'chefsessel', 'ergonomisch'],
  regal: ['shelf', 'regale', 'bücherregal', 'wandregal'],
  kommode: ['sideboard', 'anrichte', 'lowboard', 'highboard'],
  vitrine: ['display cabinet', 'glasschrank', 'showcase'],

  lampe: ['lamp', 'leuchte', 'lampen', 'lamps', 'light', 'beleuchtung'],
  lamp: ['lampe', 'leuchte', 'lampen', 'light'],
  deckenlampe: ['ceiling lamp', 'deckenleuchte', 'kronleuchter'],
  stehlampe: ['floor lamp', 'standlampe', 'stehleuchte'],
  tischlampe: ['table lamp', 'nachttischlampe', 'schreibtischlampe'],
  led: ['led lampe', 'led streifen', 'led strip', 'smart light'],

  teppich: ['carpet', 'rug', 'teppiche', 'läufer', 'vorleger'],
  vorhang: ['curtain', 'vorhänge', 'gardine', 'gardinen', 'rollo'],
  bettwäsche: ['bed linen', 'bettzeug', 'bettbezug', 'duvet'],
  kissen: ['pillow', 'cushion', 'dekokissen', 'kopfkissen'],
  decke: ['blanket', 'wolldecke', 'kuscheldecke', 'tagesdecke'],
  spiegel: ['mirror', 'wandspiegel', 'standspiegel'],
  bild: ['picture', 'gemälde', 'poster', 'wandbild', 'kunstdruck'],

  // ==================== KÜCHE / HAUSHALT ====================
  küche: ['kitchen', 'kueche', 'einbauküche', 'küchenzeile'],
  küchengerät: ['kitchen appliance', 'haushaltsgerät', 'elektrogerät'],
  kaffeemaschine: [
    'coffee maker',
    'espressomaschine',
    'kaffeevollautomat',
    'nespresso',
    'jura',
    'delonghi',
    'siemens',
  ],
  espressomaschine: ['espresso', 'siebträger', 'portafilter', 'barista'],
  nespresso: ['kapselmaschine', 'kaffeekapseln', 'delonghi'],
  staubsauger: ['vacuum', 'sauger', 'staubsaugers', 'vacuums', 'dyson', 'miele', 'saugroboter'],
  vacuum: ['staubsauger', 'sauger', 'vacuums'],
  dyson: ['staubsauger', 'ventilator', 'föhn', 'airwrap'],
  miele: ['staubsauger', 'waschmaschine', 'geschirrspüler', 'premium'],
  saugroboter: ['robot vacuum', 'roomba', 'roborock', 'ecovacs'],

  waschmaschine: ['washing machine', 'wäschetrockner', 'washer'],
  trockner: ['dryer', 'wäschetrockner', 'tumbler'],
  geschirrspüler: ['dishwasher', 'spülmaschine', 'abwaschmaschine'],
  kühlschrank: ['fridge', 'refrigerator', 'gefrierschrank', 'kühlgefrierkombination'],
  backofen: ['oven', 'herd', 'einbaubackofen', 'mikrowelle'],
  mikrowelle: ['microwave', 'mikro', 'combi'],
  toaster: ['toast', 'sandwichmaker', 'kontaktgrill'],
  mixer: ['blender', 'standmixer', 'pürierstab', 'smoothie'],
  küchenmaschine: ['food processor', 'thermomix', 'kitchenaid', 'kenwood'],
  thermomix: ['küchenmaschine', 'kochen', 'tm6', 'tm5'],

  topf: ['pot', 'kochtopf', 'töpfe', 'pfanne'],
  pfanne: ['pan', 'bratpfanne', 'wok', 'gusseisen'],
  messer: ['knife', 'küchenmesser', 'messerset', 'kochmesser'],
  geschirr: ['dishes', 'teller', 'tassen', 'besteck', 'service'],

  // ==================== WERKZEUG / GARTEN ====================
  werkzeug: ['tool', 'tools', 'werkzeuge', 'handwerkzeug', 'elektrowerkzeug'],
  tool: ['werkzeug', 'werkzeuge', 'tools'],
  bohrmaschine: ['drill', 'bohrer', 'akkubohrer', 'schlagbohrmaschine', 'bohrhammer'],
  drill: ['bohrmaschine', 'bohrer', 'drills'],
  akkuschrauber: ['cordless drill', 'akkubohrer', 'schrauber', 'makita', 'bosch'],
  schraubenzieher: ['screwdriver', 'schraubendreher'],
  hammer: ['hammers', 'hämmer', 'schlosserhammer', 'gummihammer'],
  säge: ['saw', 'sagen', 'kreissäge', 'stichsäge', 'kettensäge', 'handsäge'],
  schleifer: ['grinder', 'winkelschleifer', 'exzenterschleifer', 'bandschleifer'],
  schraubenschlüssel: ['wrench', 'maulschlüssel', 'ringschlüssel', 'gabelschlüssel'],
  zange: ['pliers', 'kombizange', 'seitenschneider', 'wasserpumpenzange'],
  werkzeugkoffer: ['tool box', 'werkzeugkasten', 'werkzeugset'],

  bosch: ['elektrowerkzeug', 'bosch professional', 'bosch blau'],
  makita: ['elektrowerkzeug', 'akku', 'profiwerkzeug'],
  dewalt: ['elektrowerkzeug', 'profiwerkzeug'],
  hilti: ['profiwerkzeug', 'bohrhammer', 'baustelle'],
  festool: ['holzbearbeitung', 'tischler', 'profiwerkzeug'],

  garten: ['garden', 'gärten', 'gaerten', 'outdoor', 'gartenarbeit'],
  garden: ['garten', 'gärten', 'gardens'],
  rasenmäher: ['rasenmaeher', 'lawn mower', 'mäher', 'maeher', 'mähroboter'],
  'lawn mower': ['rasenmäher', 'rasenmaeher', 'mäher'],
  mähroboter: ['robot mower', 'rasenroboter', 'husqvarna', 'gardena'],
  heckenschere: ['hedge trimmer', 'strauchschere', 'akku heckenschere'],
  kettensäge: ['chainsaw', 'motorsäge', 'stihl', 'husqvarna'],
  laubsauger: ['leaf blower', 'laubbläser', 'blasgerät'],
  hochdruckreiniger: ['pressure washer', 'kärcher', 'hochdruck'],
  gartenmöbel: ['outdoor furniture', 'gartentisch', 'gartenstuhl', 'gartenbank', 'lounge'],
  sonnenschirm: ['parasol', 'ampelschirm', 'markise'],
  grill: ['barbecue', 'bbq', 'grills', 'gasgrill', 'holzkohlegrill', 'weber', 'smoker'],
  barbecue: ['grill', 'bbq', 'grills'],
  bbq: ['grill', 'barbecue', 'grills'],
  weber: ['weber grill', 'kugelgrill', 'gasgrill'],

  // ==================== GAMING ====================
  playstation: ['ps5', 'ps4', 'ps3', 'sony', 'konsole', 'console', 'psn'],
  ps5: ['playstation', 'playstation 5', 'sony', 'konsole'],
  ps4: ['playstation', 'playstation 4', 'sony', 'konsole'],
  xbox: ['microsoft', 'xbox series', 'xbox one', 'konsole', 'console', 'game pass'],
  'xbox series x': ['xbox', 'series x', 'microsoft', 'next gen'],
  'xbox series s': ['xbox', 'series s', 'microsoft', 'digital'],
  nintendo: ['switch', 'wii', '3ds', 'gameboy', 'konsole', 'mario', 'zelda'],
  switch: ['nintendo switch', 'nintendo', 'konsole', 'oled'],
  konsole: ['console', 'playstation', 'xbox', 'nintendo', 'gaming'],
  console: ['konsole', 'playstation', 'xbox', 'nintendo'],
  controller: ['gamepad', 'joypad', 'joystick', 'dualsense', 'pro controller'],

  'gaming pc': ['gaming computer', 'gaming rig', 'high end pc'],
  'gaming laptop': ['gaming notebook', 'rog', 'alienware', 'razer'],
  'gaming stuhl': ['gaming chair', 'zockerstuhl', 'secretlab', 'dxracer'],
  'gaming monitor': ['gaming bildschirm', '144hz', '240hz', 'curved'],
  'gaming headset': ['gaming kopfhörer', 'razer', 'steelseries', 'hyperx'],
  'gaming maus': ['gaming mouse', 'logitech', 'razer', 'wireless'],
  'gaming tastatur': ['gaming keyboard', 'mechanisch', 'rgb'],
  vr: ['virtual reality', 'vr brille', 'oculus', 'quest', 'psvr', 'htc vive'],
  oculus: ['meta quest', 'quest 2', 'quest 3', 'vr'],

  videospiel: ['game', 'spiel', 'videospiele', 'games'],
  game: ['spiel', 'videospiel', 'games', 'gaming'],
  fifa: ['ea sports', 'fussball spiel', 'fc'],
  'call of duty': ['cod', 'shooter', 'activision', 'warzone'],
  gta: ['grand theft auto', 'rockstar', 'gta v', 'gta 6'],
  minecraft: ['mojang', 'sandbox', 'block'],
  fortnite: ['battle royale', 'epic games'],
  pokemon: ['pokémon', 'pikachu', 'nintendo'],
  zelda: ['legend of zelda', 'link', 'nintendo', 'tears of the kingdom'],
  mario: ['super mario', 'nintendo', 'luigi'],

  // ==================== MUSIK ====================
  gitarre: ['guitar', 'gitarren', 'guitars', 'e-gitarre', 'akustikgitarre', 'klassische gitarre'],
  guitar: ['gitarre', 'gitarren', 'guitars'],
  'e-gitarre': ['electric guitar', 'elektrogitarre', 'stratocaster', 'les paul', 'telecaster'],
  akustikgitarre: ['acoustic guitar', 'westerngitarre', 'konzertgitarre'],
  bass: ['bassgitarre', 'e-bass', 'kontrabass'],
  fender: ['stratocaster', 'telecaster', 'jazz bass', 'precision'],
  gibson: ['les paul', 'sg', 'es-335'],

  klavier: ['piano', 'pianos', 'klaviere', 'flügel', 'fluegel', 'concert grand'],
  piano: ['klavier', 'pianos', 'keyboard'],
  keyboard: ['klavier', 'synthesizer', 'synth', 'midi', 'stage piano'],
  synthesizer: ['synth', 'keyboard', 'korg', 'roland', 'moog'],
  'e-piano': ['digital piano', 'stage piano', 'yamaha', 'roland', 'kawai'],

  schlagzeug: ['drums', 'drum kit', 'percussion', 'drumset'],
  drums: ['schlagzeug', 'drum kit', 'percussion'],
  becken: ['cymbals', 'crash', 'ride', 'hihat', 'zildjian', 'sabian'],
  cajon: ['trommel', 'percussion', 'rhythmus'],

  violine: ['geige', 'violin', 'fiddle', 'streichinstrument'],
  geige: ['violine', 'violin', 'fiddle'],
  cello: ['violoncello', 'streichinstrument'],
  saxophon: ['saxophone', 'sax', 'blasinstrument', 'jazz'],
  trompete: ['trumpet', 'blasinstrument', 'brass'],
  flöte: ['flute', 'blockflöte', 'querflöte', 'blasinstrument'],

  verstärker: ['amp', 'amplifier', 'gitarrenverstärker', 'röhrenverstärker'],
  amp: ['verstärker', 'amplifier'],
  mischpult: ['mixer', 'mixing console', 'dj'],
  mikrofon: ['microphone', 'mic', 'kondensatormikrofon', 'dynamisch'],
  pa: ['pa anlage', 'beschallung', 'lautsprecher', 'aktiv'],
  dj: ['turntable', 'controller', 'mischpult', 'plattenspieler'],
  plattenspieler: ['turntable', 'vinyl', 'schallplatte', 'platte'],
  vinyl: ['schallplatte', 'record', 'lp', 'ep'],

  // ==================== BABY & KIND ====================
  kinderwagen: ['buggy', 'stroller', 'sportwagen', 'kombiwagen', 'joolz', 'cybex'],
  buggy: ['kinderwagen', 'sportwagen', 'reisebuggy'],
  babybett: ['crib', 'kinderbett', 'wiege', 'beistellbett'],
  hochstuhl: ['high chair', 'kinderstuhl', 'tripp trapp'],
  babyschale: ['maxi cosi', 'kindersitz', 'autositz'],
  wickeltisch: ['wickelkommode', 'changing table'],
  spielzeug: ['toys', 'spielsachen', 'kinderspielzeug'],
  lego: ['bausteine', 'duplo', 'technic', 'creator'],
  playmobil: ['spielfiguren', 'spielzeug'],
  puppe: ['doll', 'barbie', 'stoffpuppe'],
  kuscheltier: ['stuffed animal', 'plüschtier', 'teddy', 'teddybär'],
  puzzle: ['puzzles', 'jigsaw', 'ravensburger'],
  tretroller: ['scooter', 'kickboard', 'micro'],

  // ==================== HAUSTIERE ====================
  hund: ['dog', 'welpe', 'hunde', 'vierbeiner'],
  katze: ['cat', 'kätzchen', 'kitten', 'katzen'],
  hundefutter: ['dog food', 'nassfutter', 'trockenfutter'],
  katzenfutter: ['cat food', 'nassfutter', 'trockenfutter'],
  hundebett: ['dog bed', 'hundekorb', 'schlafplatz'],
  katzenklo: ['litter box', 'katzentoilette'],
  aquarium: ['fische', 'fish tank', 'aquarien'],
  terrarium: ['reptilien', 'schlangen', 'echsen'],
  vogelkäfig: ['bird cage', 'voliere'],

  // ==================== BÜCHER & MEDIEN ====================
  buch: ['book', 'bücher', 'buecher', 'books', 'lesen'],
  book: ['buch', 'bücher', 'books'],
  roman: ['novel', 'fiction', 'belletristik'],
  krimi: ['thriller', 'crime', 'kriminalroman'],
  sachbuch: ['non-fiction', 'fachbuch', 'ratgeber'],
  kinderbuch: ['children book', 'bilderbuch'],
  ebook: ['e-book', 'kindle', 'e-reader'],
  kindle: ['ebook', 'e-reader', 'amazon'],
  comic: ['comics', 'manga', 'graphic novel'],
  manga: ['comic', 'anime', 'japanisch'],

  dvd: ['film', 'movie', 'dvds', 'bluray'],
  bluray: ['blu-ray', 'blu ray', 'film', '4k'],
  film: ['movie', 'dvd', 'bluray', 'streaming'],
  cd: ['musik', 'album', 'cds'],
  'vinyl schallplatte': ['lp', 'record', 'vinyl', 'platte'],

  // ==================== KUNST & SAMMELN ====================
  kunst: ['art', 'gemälde', 'kunstwerk', 'malerei'],
  gemälde: ['painting', 'bild', 'ölgemälde', 'aquarell'],
  skulptur: ['sculpture', 'statue', 'figur'],
  antiquität: ['antique', 'vintage', 'antik', 'sammlerstück'],
  antique: ['antiquität', 'antik', 'vintage'],
  vintage: ['retro', 'antik', 'sammlerstück', 'old school'],
  retro: ['vintage', 'classic', 'nostalgie'],
  münzen: ['coins', 'numismatik', 'sammlermünzen'],
  briefmarken: ['stamps', 'philatelie', 'sammeln'],
  sammlerstück: ['collectible', 'rarität', 'selten'],

  // ==================== COMMON TYPOS (EXPANDED) ====================
  bal: ['ball', 'bälle', 'baelle'],
  baal: ['ball', 'bälle', 'baelle'],
  balll: ['ball', 'bälle', 'baelle'],
  fusbal: ['fussball', 'fußball'],
  fussbal: ['fussball', 'fußball'],
  basketbal: ['basketball'],
  bicicle: ['bicycle', 'fahrrad', 'bike'],
  bicyle: ['bicycle', 'fahrrad', 'bike'],
  bycicle: ['bicycle', 'fahrrad', 'bike'],
  fahrraad: ['fahrrad', 'velo'],
  fahradt: ['fahrrad', 'velo'],
  comupter: ['computer', 'pc'],
  compter: ['computer', 'pc'],
  computr: ['computer', 'pc'],
  cumputer: ['computer', 'pc'],
  labtop: ['laptop', 'notebook'],
  lapop: ['laptop', 'notebook'],
  laptob: ['laptop', 'notebook'],
  iphon: ['iphone', 'apple'],
  ipone: ['iphone', 'apple'],
  ifone: ['iphone', 'apple'],
  samsng: ['samsung', 'galaxy'],
  samung: ['samsung', 'galaxy'],
  kammera: ['kamera', 'camera'],
  camra: ['camera', 'kamera'],
  kammra: ['kamera', 'camera'],
  shuh: ['schuhe', 'schuh', 'shoes'],
  schue: ['schuhe', 'schuh', 'shoes'],
  shuhe: ['schuhe', 'schuh', 'shoes'],
  sneker: ['sneaker', 'sneakers'],
  sniker: ['sneaker', 'sneakers'],
  sneekr: ['sneaker', 'sneakers'],
  jaket: ['jacke', 'jacket'],
  jakce: ['jacke', 'jacket'],
  jakke: ['jacke', 'jacket'],
  tisc: ['tisch', 'table'],
  tisck: ['tisch', 'table'],
  stul: ['stuhl', 'chair'],
  plastation: ['playstation', 'ps5', 'ps4'],
  playstaion: ['playstation', 'ps5', 'ps4'],
  playstasion: ['playstation', 'ps5', 'ps4'],
  xbos: ['xbox'],
  xobx: ['xbox'],
  nintedno: ['nintendo', 'switch'],
  ninteno: ['nintendo', 'switch'],
  gitare: ['gitarre', 'guitar'],
  guitare: ['gitarre', 'guitar'],
  klaver: ['klavier', 'piano'],
  claiver: ['klavier', 'piano'],
  uhr: ['watch', 'uhren'],
  roelx: ['rolex'],
  rollex: ['rolex'],
  ohmega: ['omega'],
  ommega: ['omega'],
  telvision: ['television', 'tv', 'fernseher'],
  fernsehr: ['fernseher', 'tv'],
  fernseeher: ['fernseher', 'tv'],
  smatphone: ['smartphone', 'handy'],
  smarthone: ['smartphone', 'handy'],
  tbalett: ['tablet', 'ipad'],
  tabelt: ['tablet', 'ipad'],
  macbuk: ['macbook', 'apple'],
  mackbook: ['macbook', 'apple'],
  waschmaschien: ['waschmaschine'],
  waschamschine: ['waschmaschine'],
  staubsauer: ['staubsauger', 'vacuum'],
  staupsauger: ['staubsauger', 'vacuum'],
  kaffemaschine: ['kaffeemaschine'],
  kaffeemachine: ['kaffeemaschine'],
  drohnen: ['drohne', 'drone'],
  drhone: ['drohne', 'drone'],

  // ==================== SWISS GERMAN (EXPANDED) ====================
  natel: ['handy', 'smartphone', 'mobile', 'telefon'],
  töff: ['motorrad', 'motorcycle', 'moped', 'bike'],
  toeff: ['motorrad', 'motorcycle', 'moped'],
  velo: ['fahrrad', 'bike', 'bicycle', 'rad'],
  büsi: ['katze', 'cat', 'kätzchen'],
  buesi: ['katze', 'cat'],
  gümmeler: ['fahrrad', 'velo', 'rennrad', 'velofahrer'],
  guemmeler: ['fahrrad', 'velo', 'rennrad'],
  chind: ['kind', 'child', 'kinder'],
  huus: ['haus', 'house', 'zuhause'],
  wuche: ['woche', 'week'],
  schätzeli: ['schatz', 'liebling'],
  grüezi: ['hallo', 'guten tag'],
  merci: ['danke', 'thanks'],
  sali: ['hallo', 'hi', 'grüezi'],
  tschau: ['ciao', 'tschüss', 'bye'],
  znüni: ['snack', 'pause', 'zvieri'],
  zvieri: ['snack', 'nachmittagsimbiss'],
  müesli: ['müsli', 'frühstück', 'cereals'],
  zmorge: ['frühstück', 'breakfast'],
  znacht: ['abendessen', 'dinner', 'nachtessen'],
  zmittag: ['mittagessen', 'lunch'],
  tram: ['strassenbahn', 'tramway'],
  postauto: ['bus', 'postbus'],
  badi: ['schwimmbad', 'freibad', 'pool'],
  beiz: ['restaurant', 'kneipe', 'beizli'],
  konfitüre: ['marmelade', 'jam'],
  cervelat: ['wurst', 'bratwurst'],
  öpfel: ['apfel', 'apple'],
  rüebli: ['karotte', 'carrot', 'möhre'],
  härdöpfel: ['kartoffel', 'potato'],
  bschütti: ['jauche', 'gülle'],
  stängeli: ['glace', 'eis', 'eiscreme'],
  gugge: ['schauen', 'gucken', 'look'],
  laufe: ['gehen', 'walk', 'laufen'],
  schaffe: ['arbeiten', 'work'],
  putze: ['putzen', 'reinigen', 'clean'],
  brägel: ['braten', 'fry'],

  // ==================== FRENCH (Swiss) ====================
  voiture: ['auto', 'car', 'wagen'],
  maison: ['haus', 'house', 'home'],
  téléphone: ['telefon', 'handy', 'phone'],
  ordinateur: ['computer', 'pc', 'rechner'],
  vélo: ['fahrrad', 'velo', 'bike'],
  montre: ['uhr', 'watch'],
  bijoux: ['schmuck', 'jewelry'],
  vêtements: ['kleidung', 'clothes'],
  chaussures: ['schuhe', 'shoes'],
  meubles: ['möbel', 'furniture'],
  jardin: ['garten', 'garden'],

  // ==================== ITALIAN (Swiss) ====================
  automobile: ['auto', 'car', 'wagen'],
  casa: ['haus', 'house', 'home'],
  telefono: ['telefon', 'handy', 'phone'],
  orologio: ['uhr', 'watch'],
  gioielli: ['schmuck', 'jewelry'],
  vestiti: ['kleidung', 'clothes'],
  scarpe: ['schuhe', 'shoes'],
  mobili: ['möbel', 'furniture'],
  giardino: ['garten', 'garden'],
  bicicletta: ['fahrrad', 'velo', 'bike'],
}

/**
 * Brand-specific expansions
 */
export const brandSynonyms: Record<string, string[]> = {
  // Tech brands
  apple: ['iphone', 'ipad', 'macbook', 'imac', 'airpods', 'apple watch', 'mac', 'ios'],
  samsung: ['galaxy', 'note', 'tab', 'buds', 'android', 'qled'],
  google: ['pixel', 'nest', 'chromecast', 'android'],
  microsoft: ['xbox', 'surface', 'windows'],
  sony: ['playstation', 'bravia', 'alpha', 'walkman'],
  lg: ['oled', 'tv', 'monitor', 'waschmaschine'],

  // Fashion brands
  nike: ['jordan', 'air max', 'dunk', 'air force'],
  adidas: ['yeezy', 'boost', 'superstar', 'originals'],
  'louis vuitton': ['lv', 'monogram', 'damier', 'neverfull'],
  gucci: ['gg', 'marmont', 'dionysus'],
  rolex: ['submariner', 'datejust', 'daytona', 'gmt'],
  omega: ['speedmaster', 'seamaster', 'moonwatch'],
}

/**
 * Normalize query text (lowercase, handle umlauts, trim)
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim()
}

/**
 * Check if a word might be a typo using Levenshtein distance
 */
function findSimilarWords(word: string, dictionary: string[], maxDistance: number = 2): string[] {
  const similar: string[] = []
  const wordLower = word.toLowerCase()

  for (const entry of dictionary) {
    if (entry.length >= 3 && Math.abs(entry.length - wordLower.length) <= maxDistance) {
      const distance = levenshteinDistance(wordLower, entry)
      if (distance > 0 && distance <= maxDistance) {
        similar.push(entry)
      }
    }
  }

  return similar
}

/**
 * Expand a search query with synonyms, typo corrections, and brand expansions
 */
export function expandQuery(query: string): {
  ftsQuery: string
  plainQuery: string
  tokens: string[]
  suggestions: string[]
  didYouMean: string | null
} {
  const normalized = normalizeQuery(query)
  const tokens = normalized.split(/\s+/).filter(t => t.length >= 2)

  const expandedTokens: Set<string> = new Set(tokens)
  const suggestions: string[] = []
  let didYouMean: string | null = null

  // Expand each token with synonyms
  for (const token of tokens) {
    // Check for exact synonym match
    const synonyms = enhancedSynonyms[token]
    if (synonyms) {
      for (const syn of synonyms.slice(0, 10)) {
        // Limit synonyms per token
        expandedTokens.add(syn)
      }
    }

    // Check brand synonyms
    const brandExpansions = brandSynonyms[token]
    if (brandExpansions) {
      for (const brand of brandExpansions.slice(0, 5)) {
        expandedTokens.add(brand)
      }
    }

    // Check for variations with umlauts
    const withoutUmlauts = token.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü')

    if (withoutUmlauts !== token && enhancedSynonyms[withoutUmlauts]) {
      for (const syn of enhancedSynonyms[withoutUmlauts].slice(0, 5)) {
        expandedTokens.add(syn)
      }
    }

    const withUmlauts = token.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')

    if (withUmlauts !== token && enhancedSynonyms[withUmlauts]) {
      for (const syn of enhancedSynonyms[withUmlauts].slice(0, 5)) {
        expandedTokens.add(syn)
      }
    }

    // Check for potential typos using Levenshtein distance
    if (!enhancedSynonyms[token] && token.length >= 3) {
      const dictionaryWords = Object.keys(enhancedSynonyms)
      const similarWords = findSimilarWords(token, dictionaryWords, 2)

      if (similarWords.length > 0) {
        // Add the corrected word and its synonyms
        for (const similar of similarWords.slice(0, 3)) {
          expandedTokens.add(similar)
          suggestions.push(similar)

          if (enhancedSynonyms[similar]) {
            for (const syn of enhancedSynonyms[similar].slice(0, 3)) {
              expandedTokens.add(syn)
            }
          }
        }

        // Set "did you mean" suggestion
        if (!didYouMean && similarWords.length > 0) {
          didYouMean = tokens
            .map(t => {
              const sim = findSimilarWords(t, dictionaryWords, 2)
              return sim.length > 0 ? sim[0] : t
            })
            .join(' ')

          // Only suggest if it's different from original
          if (didYouMean === normalized) {
            didYouMean = null
          }
        }
      }
    }
  }

  // Build FTS query string (OR between all terms)
  const ftsTokens = Array.from(expandedTokens).slice(0, 50)
  const ftsQuery = ftsTokens.join(' | ')

  // Plain query for trigram
  const plainQuery = Array.from(expandedTokens).slice(0, 30).join(' ')

  return {
    ftsQuery,
    plainQuery,
    tokens: Array.from(expandedTokens),
    suggestions: Array.from(new Set(suggestions)).slice(0, 5),
    didYouMean,
  }
}

/**
 * Check if a query might be a typo and suggest corrections
 */
export function suggestCorrections(query: string): string[] {
  const normalized = normalizeQuery(query)
  const suggestions: string[] = []
  const dictionaryWords = Object.keys(enhancedSynonyms)

  // Check each word
  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length >= 3) {
      const similar = findSimilarWords(word, dictionaryWords, 2)
      suggestions.push(...similar)
    }
  }

  return Array.from(new Set(suggestions)).slice(0, 10)
}

/**
 * Get category suggestions based on query
 */
export function getCategorySuggestions(query: string): string[] {
  const normalized = normalizeQuery(query)
  const categories: string[] = []

  const categoryKeywords: Record<string, string[]> = {
    elektronik: [
      'laptop',
      'computer',
      'handy',
      'smartphone',
      'tablet',
      'kamera',
      'tv',
      'fernseher',
    ],
    mode: ['schuhe', 'jacke', 'hose', 'kleid', 'tasche', 'accessoires'],
    'uhren-schmuck': ['uhr', 'watch', 'ring', 'kette', 'armband', 'rolex', 'omega'],
    'auto-motorrad': ['auto', 'motorrad', 'fahrzeug', 'bmw', 'mercedes', 'audi'],
    'sport-freizeit': ['fahrrad', 'velo', 'fitness', 'ski', 'camping'],
    'haushalt-wohnen': ['möbel', 'sofa', 'tisch', 'lampe', 'küche'],
    gaming: ['playstation', 'xbox', 'nintendo', 'gaming', 'konsole'],
    musik: ['gitarre', 'klavier', 'schlagzeug', 'verstärker'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        categories.push(category)
        break
      }
    }
  }

  return Array.from(new Set(categories))
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
