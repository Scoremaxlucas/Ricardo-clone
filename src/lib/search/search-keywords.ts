/**
 * Category-Specific Keywords for Search Indexing
 * 
 * These keywords are added to the searchText when an item belongs to a category.
 * This allows finding items even when the title doesn't contain category-related words.
 * 
 * Example: A listing titled "Test" in category "Sport" with these keywords
 *          will be findable by searching "ball", "sport", "fitness" etc.
 */

export const categoryKeywordsForSearch: Record<string, string[]> = {
  // SPORT & FITNESS
  'sport': [
    'sport', 'fitness', 'training', 'workout', 'exercise',
    'ball', 'baelle', 'fussball', 'soccer', 'football',
    'basketball', 'volleyball', 'handball', 'tennis', 'tennisball',
    'golf', 'golfball', 'rugby', 'baseball', 'softball',
    'fahrrad', 'velo', 'bike', 'cycling', 'rennrad', 'mountainbike', 'ebike', 'e-bike',
    'laufen', 'running', 'joggen', 'jogging', 'marathon',
    'schwimmen', 'swimming', 'tauchen', 'diving',
    'ski', 'skifahren', 'snowboard', 'wintersport',
    'klettern', 'climbing', 'bouldern', 'wandern', 'hiking', 'trekking',
    'yoga', 'pilates', 'crossfit', 'bodybuilding', 'krafttraining',
    'sportgeraet', 'sportausruestung', 'sportbekleidung',
  ],
  
  'sport-fitness': [
    'fitness', 'gym', 'fitnessstudio', 'training', 'workout',
    'hantel', 'hanteln', 'dumbbell', 'kettlebell', 'gewichte',
    'laufband', 'treadmill', 'ergometer', 'crosstrainer', 'rudergeraet',
    'yoga', 'yogamatte', 'pilates', 'stretching',
    'widerstandsband', 'resistance band', 'theraband',
    'muskelaufbau', 'cardio', 'ausdauer',
  ],
  
  'sport-ballsport': [
    'ball', 'baelle', 'fussball', 'soccer', 'football',
    'basketball', 'korb', 'volleyball', 'netz', 'handball',
    'tennis', 'tennisschlaeger', 'badminton', 'federball',
    'tischtennis', 'pingpong', 'golf', 'golfschlaeger',
    'rugby', 'baseball', 'softball', 'hockey', 'puck',
    'bowling', 'kegeln', 'billard', 'snooker', 'pool',
  ],
  
  'sport-radsport': [
    'fahrrad', 'velo', 'bike', 'cycling', 'rad', 'raeder',
    'rennrad', 'roadbike', 'mountainbike', 'mtb', 'gravelbike',
    'ebike', 'e-bike', 'elektrofahrrad', 'pedelec',
    'bmx', 'downhill', 'enduro', 'crossbike', 'citybike',
    'fahrradhelm', 'helm', 'fahrradtasche', 'satteltasche',
    'pedale', 'lenker', 'sattel', 'reifen', 'schlauch',
    'shimano', 'sram', 'campagnolo', 'specialized', 'trek', 'giant', 'scott', 'canyon',
  ],
  
  'sport-wintersport': [
    'ski', 'skier', 'skifahren', 'alpin', 'langlauf', 'nordisch',
    'snowboard', 'snowboarden', 'freeride', 'freestyle',
    'skischuhe', 'skistiefel', 'skibindung', 'skihelm',
    'skibrille', 'goggle', 'skihose', 'skijacke',
    'schlitten', 'bob', 'rodel', 'schlittschuhe', 'eishockey',
    'schnee', 'winter', 'piste', 'tiefschnee', 'powder',
  ],
  
  // ELEKTRONIK
  'elektronik': [
    'elektronik', 'electronic', 'technik', 'tech', 'gadget',
    'computer', 'pc', 'laptop', 'notebook', 'tablet',
    'handy', 'smartphone', 'phone', 'telefon',
    'kamera', 'camera', 'foto', 'video',
    'tv', 'fernseher', 'television', 'monitor', 'bildschirm',
    'audio', 'lautsprecher', 'speaker', 'kopfhoerer', 'headphones',
    'gaming', 'konsole', 'playstation', 'xbox', 'nintendo',
  ],
  
  'computer-netzwerk': [
    'computer', 'pc', 'rechner', 'desktop', 'workstation',
    'laptop', 'notebook', 'macbook', 'thinkpad', 'ultrabook',
    'tablet', 'ipad', 'surface', 'android tablet',
    'monitor', 'bildschirm', 'display', 'screen',
    'tastatur', 'keyboard', 'mechanisch',
    'maus', 'mouse', 'gaming maus', 'trackpad',
    'drucker', 'printer', 'scanner', 'multifunktionsgeraet',
    'festplatte', 'ssd', 'hdd', 'speicher', 'memory', 'ram',
    'grafikkarte', 'gpu', 'nvidia', 'amd', 'geforce', 'radeon',
    'prozessor', 'cpu', 'intel', 'ryzen',
    'mainboard', 'motherboard', 'netzteil', 'gehaeuse', 'case',
    'router', 'switch', 'netzwerk', 'network', 'wlan', 'wifi',
    'server', 'nas', 'backup', 'cloud',
  ],
  
  'handy-telefon': [
    'handy', 'smartphone', 'mobiltelefon', 'mobile phone', 'cell phone',
    'iphone', 'apple', 'samsung', 'galaxy', 'pixel', 'google',
    'huawei', 'xiaomi', 'oppo', 'oneplus', 'motorola', 'nokia',
    'android', 'ios',
    'handyhuelle', 'case', 'schutzhuelle', 'panzerglas',
    'ladegeraet', 'charger', 'powerbank', 'akku', 'battery',
    'smartwatch', 'apple watch', 'galaxy watch', 'fitnesstracker',
    'kopfhoerer', 'airpods', 'earbuds', 'bluetooth',
  ],
  
  'foto-optik': [
    'kamera', 'camera', 'fotoapparat', 'fotokamera',
    'spiegelreflex', 'dslr', 'mirrorless', 'systemkamera',
    'kompaktkamera', 'bridgekamera', 'sofortbildkamera', 'polaroid', 'instax',
    'objektiv', 'lens', 'linse', 'weitwinkel', 'tele', 'zoom', 'festbrennweite', 'prime',
    'canon', 'nikon', 'sony', 'fuji', 'fujifilm', 'panasonic', 'olympus', 'leica', 'pentax',
    'blitz', 'flash', 'stativ', 'tripod', 'gimbal', 'stabilizer',
    'filter', 'nd filter', 'polfilter', 'uv filter',
    'kameratasche', 'kamerarucksack', 'fototasche',
    'speicherkarte', 'sd card', 'cf card',
    'drohne', 'drone', 'dji', 'mavic', 'phantom', 'quadcopter',
    'gopro', 'action camera', 'actionkamera',
    'fernglas', 'binoculars', 'teleskop', 'telescope', 'mikroskop',
  ],
  
  'tv-video-audio': [
    'fernseher', 'tv', 'television', 'smart tv', 'oled', 'qled', 'lcd', 'led',
    'samsung', 'lg', 'sony', 'philips', 'panasonic',
    'heimkino', 'home cinema', 'beamer', 'projektor', 'projector',
    'soundbar', 'lautsprecher', 'speaker', 'subwoofer', 'surround',
    'receiver', 'verstaerker', 'amplifier', 'hifi', 'stereo',
    'kopfhoerer', 'headphones', 'bluetooth', 'wireless', 'kabellos',
    'mikrofon', 'microphone', 'podcast', 'streaming',
    'dvd', 'blu-ray', 'bluray', 'player', 'recorder',
    'streaming', 'apple tv', 'fire tv', 'chromecast', 'roku',
  ],
  
  'games-konsolen': [
    'playstation', 'ps5', 'ps4', 'ps3', 'sony',
    'xbox', 'xbox series', 'xbox one', 'microsoft',
    'nintendo', 'switch', 'wii', '3ds', 'gameboy',
    'konsole', 'console', 'gaming',
    'controller', 'gamepad', 'joystick',
    'videospiel', 'video game', 'game', 'spiel',
    'pc gaming', 'gaming pc', 'gaming laptop',
    'vr', 'virtual reality', 'oculus', 'quest', 'psvr',
    'headset', 'gaming headset',
    'lenkrad', 'racing wheel', 'simulator',
  ],
  
  // MODE & KLEIDUNG
  'kleidung-accessoires': [
    'kleidung', 'mode', 'fashion', 'bekleidung', 'clothes', 'clothing',
    'jacke', 'jacket', 'mantel', 'coat', 'parka', 'blazer',
    'hose', 'pants', 'jeans', 'chino', 'shorts',
    'shirt', 'tshirt', 't-shirt', 'hemd', 'bluse',
    'pullover', 'sweater', 'hoodie', 'sweatshirt',
    'kleid', 'dress', 'rock', 'skirt',
    'anzug', 'suit', 'kostüm', 'sakko',
    'schuhe', 'shoes', 'sneaker', 'turnschuhe', 'sportschuhe',
    'stiefel', 'boots', 'sandalen', 'pumps', 'loafer',
    'tasche', 'bag', 'handtasche', 'rucksack', 'backpack',
    'guertel', 'belt', 'schal', 'scarf', 'muetze', 'hat', 'cap',
    'sonnenbrille', 'sunglasses', 'brille', 'glasses',
    'schmuck', 'jewelry', 'kette', 'armband', 'ring', 'ohrring',
    'nike', 'adidas', 'puma', 'new balance', 'asics', 'reebok',
    'gucci', 'prada', 'louis vuitton', 'balenciaga', 'versace',
    'zara', 'h&m', 'uniqlo', 'mango',
  ],
  
  // UHREN & SCHMUCK
  'uhren-schmuck': [
    'uhr', 'watch', 'armbanduhr', 'wristwatch', 'zeitmesser',
    'chronograph', 'automatik', 'automatic', 'mechanisch', 'quarz', 'quartz',
    'taucheruhr', 'diver', 'fliegeruhr', 'pilot', 'sportuhr',
    'rolex', 'omega', 'breitling', 'tag heuer', 'iwc', 'panerai',
    'patek philippe', 'audemars piguet', 'cartier', 'hublot',
    'tudor', 'longines', 'tissot', 'seiko', 'citizen', 'casio',
    'g-shock', 'swatch', 'apple watch', 'smartwatch',
    'submariner', 'daytona', 'datejust', 'speedmaster', 'seamaster',
    'armband', 'bracelet', 'lederband', 'edelstahl', 'stahl', 'gold',
    'diamant', 'diamond', 'brillant', 'edelstein', 'gemstone',
    'schmuck', 'jewelry', 'jewellery', 'bijoux',
    'ring', 'ringe', 'ehering', 'verlobungsring', 'trauring',
    'kette', 'halskette', 'necklace', 'anhaenger', 'pendant',
    'ohrring', 'earring', 'ohrstecker', 'creolen',
    'armreif', 'bangle', 'brosche', 'brooch',
  ],
  
  // AUTO & MOTORRAD
  'auto-motorrad': [
    'auto', 'fahrzeug', 'vehicle', 'car', 'pkw', 'wagen',
    'motorrad', 'motorcycle', 'bike', 'moped', 'roller', 'scooter',
    'bmw', 'mercedes', 'audi', 'vw', 'volkswagen', 'porsche',
    'ferrari', 'lamborghini', 'mclaren', 'bentley', 'rolls royce',
    'toyota', 'honda', 'nissan', 'mazda', 'lexus',
    'ford', 'chevrolet', 'dodge', 'jeep', 'tesla',
    'yamaha', 'kawasaki', 'suzuki', 'ducati', 'harley', 'triumph',
    'reifen', 'tire', 'felge', 'wheel', 'rad',
    'motor', 'engine', 'getriebe', 'transmission',
    'bremse', 'brake', 'stossdaempfer', 'suspension',
    'tuning', 'zubehoer', 'accessory', 'ersatzteil', 'spare part',
    'navi', 'navigation', 'gps', 'dashcam', 'autoradio',
    'kindersitz', 'car seat', 'dachbox', 'roof box',
  ],
  
  // HAUSHALT & WOHNEN
  'haushalt-wohnen': [
    'haushalt', 'household', 'wohnen', 'living', 'home',
    'moebel', 'furniture', 'einrichtung',
    'sofa', 'couch', 'sessel', 'armchair', 'stuhl', 'chair',
    'tisch', 'table', 'schreibtisch', 'desk', 'esstisch',
    'bett', 'bed', 'matratze', 'mattress', 'schrank', 'closet', 'wardrobe',
    'regal', 'shelf', 'kommode', 'sideboard', 'vitrine',
    'lampe', 'lamp', 'leuchte', 'light', 'beleuchtung',
    'teppich', 'carpet', 'rug', 'vorhang', 'curtain',
    'dekoration', 'deko', 'decoration', 'bild', 'picture', 'spiegel', 'mirror',
    'kueche', 'kitchen', 'kuechengeraet', 'appliance',
    'kaffeemaschine', 'coffee maker', 'espresso', 'nespresso', 'jura', 'delonghi',
    'mixer', 'blender', 'kuechenmaschine', 'food processor',
    'backofen', 'oven', 'herd', 'stove', 'mikrowelle', 'microwave',
    'kuehlschrank', 'refrigerator', 'fridge', 'gefrierschrank', 'freezer',
    'waschmaschine', 'washing machine', 'trockner', 'dryer',
    'staubsauger', 'vacuum', 'dyson', 'miele', 'saugroboter', 'roomba',
    'buegeleisen', 'iron', 'dampfbuegeleisen',
    'ikea', 'xxxlutz', 'pfister',
  ],
  
  // HANDWERK & GARTEN
  'handwerk-garten': [
    'werkzeug', 'tool', 'handwerkzeug', 'elektrowerkzeug',
    'bohrmaschine', 'drill', 'akkuschrauber', 'schraubenzieher', 'screwdriver',
    'saege', 'saw', 'kreissaege', 'sticksaege', 'kettensaege', 'chainsaw',
    'hammer', 'zange', 'pliers', 'schraubenschluessel', 'wrench',
    'schleifer', 'sander', 'fraese', 'router', 'hobel', 'plane',
    'messgeraet', 'wasserwaage', 'level', 'massband', 'tape measure',
    'bosch', 'makita', 'dewalt', 'milwaukee', 'metabo', 'festool', 'hilti',
    'garten', 'garden', 'outdoor',
    'rasenmaeher', 'lawn mower', 'rasentraktor', 'maehroboter',
    'heckenschere', 'hedge trimmer', 'kettensaege', 'laubbläser',
    'grill', 'barbecue', 'bbq', 'weber', 'gasgrill', 'holzkohlegrill',
    'gartenmoebel', 'outdoor furniture', 'sonnenschirm', 'pavillon',
    'pflanzen', 'plants', 'blumen', 'flowers', 'samen', 'seeds',
    'bewaesserung', 'irrigation', 'gartenschlauch', 'garden hose',
    'stihl', 'husqvarna', 'gardena',
  ],
  
  // MUSIK & INSTRUMENTE
  'musik-instrumente': [
    'musik', 'music', 'instrument', 'musical',
    'gitarre', 'guitar', 'akustikgitarre', 'e-gitarre', 'bass',
    'klavier', 'piano', 'keyboard', 'synthesizer', 'synth',
    'schlagzeug', 'drums', 'percussion', 'cajon', 'becken', 'cymbal',
    'violine', 'violin', 'geige', 'cello', 'kontrabass',
    'blaeser', 'wind instrument', 'saxophon', 'saxophone', 'trompete', 'trumpet',
    'flöte', 'flute', 'klarinette', 'clarinet', 'oboe', 'fagott',
    'fender', 'gibson', 'yamaha', 'roland', 'korg', 'steinway',
    'verstaerker', 'amplifier', 'amp', 'marshall', 'fender',
    'effektgeraet', 'pedal', 'pedalboard',
    'mikrofon', 'microphone', 'mischpult', 'mixer', 'audio interface',
    'kopfhoerer', 'headphones', 'studio', 'recording',
    'noten', 'sheet music', 'notenstaender', 'music stand',
    'dj', 'turntable', 'plattenspieler', 'controller',
  ],
  
  // BABY & KIND
  'baby-kind': [
    'baby', 'kind', 'child', 'kids', 'kinder',
    'kinderwagen', 'stroller', 'buggy', 'pram',
    'kindersitz', 'car seat', 'autositz', 'babyschale',
    'kinderbett', 'crib', 'babybett', 'wiege',
    'hochstuhl', 'high chair', 'wickeltisch', 'changing table',
    'spielzeug', 'toy', 'toys', 'spielsachen',
    'lego', 'duplo', 'playmobil', 'puzzle', 'puppe', 'doll',
    'kinderkleidung', 'babykleidung', 'strampler',
    'windel', 'diaper', 'pampers', 'schnuller', 'pacifier',
    'flasche', 'bottle', 'babyphone', 'baby monitor',
    'schulranzen', 'schulrucksack', 'schultasche',
    'tretroller', 'scooter', 'laufrad', 'balance bike',
    'maxi-cosi', 'cybex', 'chicco', 'quinny', 'bugaboo',
  ],
  
  // BÜCHER & MEDIEN
  'buecher-medien': [
    'buch', 'book', 'buecher', 'books', 'literatur', 'literature',
    'roman', 'novel', 'krimi', 'thriller', 'fantasy', 'sci-fi',
    'sachbuch', 'non-fiction', 'ratgeber', 'fachbuch',
    'kinderbuch', "children's book", 'bilderbuch', 'jugendbuch',
    'comic', 'manga', 'graphic novel',
    'zeitschrift', 'magazine', 'zeitung', 'newspaper',
    'hoerbuch', 'audiobook', 'ebook', 'e-book', 'kindle',
    'cd', 'dvd', 'blu-ray', 'vinyl', 'schallplatte', 'record',
    'film', 'movie', 'serie', 'series', 'dokumentation',
    'album', 'musik', 'music',
  ],
  
  // SAMMELN & SELTENES
  'sammeln-seltenes': [
    'sammlung', 'collection', 'sammler', 'collector',
    'antik', 'antique', 'vintage', 'retro', 'rarität', 'rare',
    'muenze', 'coin', 'muenzen', 'coins', 'numismatik',
    'briefmarke', 'stamp', 'briefmarken', 'stamps', 'philatelie',
    'modellauto', 'model car', 'modellbau', 'scale model',
    'modelleisenbahn', 'model train', 'märklin',
    'porzellan', 'porcelain', 'keramik', 'ceramic',
    'kunst', 'art', 'gemälde', 'painting', 'skulptur', 'sculpture',
    'autogramm', 'autograph', 'memorabilia',
    'militaria', 'orden', 'medal', 'uniform',
    'puppe', 'doll', 'teddy', 'steiff', 'barbie',
    'trading card', 'sammelkarte', 'pokemon', 'magic',
  ],
}

/**
 * Default keywords to add when no category is assigned
 */
export const defaultSearchKeywords = [
  'artikel', 'item', 'produkt', 'product',
  'kaufen', 'buy', 'verkaufen', 'sell',
  'gebraucht', 'used', 'secondhand', 'second hand',
  'occasion', 'schnäppchen', 'deal', 'angebot', 'offer',
]
