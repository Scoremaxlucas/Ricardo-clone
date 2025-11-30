import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Kategorie-Keyword-Mapping (spezifisch, um Verwechslungen zu vermeiden)
const categoryKeywords: Record<string, string[]> = {
  'auto-motorrad': ['fahrzeug', 'pkw', 'wagen', 'bmw', 'mercedes', 'audi', 'vw', 'volkswagen', 'porsche', 'tesla', 'ferrari', 'lamborghini', 'mclaren', 'motorrad', 'motorcycle', 'bike', 'ducati', 'yamaha', 'kawasaki', 'honda', 'suzuki', 'e-tron', 'amg', 'series', 'klasse'],
  'uhren-schmuck': ['rolex', 'omega', 'submariner', 'speedmaster', 'datejust', 'daytona', 'seamaster', 'aquanaut', 'nautilus', 'hublot', 'breitling', 'patek', 'audemars', 'cartier', 'iwc', 'panerai', 'tag heuer', 'tudor', 'longines', 'tissot', 'sinn', 'steinhart', 'armbanduhr', 'chronograph', 'taucheruhr'],
  'computer-netzwerk': ['laptop', 'notebook', 'macbook', 'thinkpad', 'computer', 'pc', 'desktop', 'tablet', 'ipad', 'monitor', 'bildschirm', 'drucker', 'printer', 'scanner', 'tastatur', 'keyboard', 'maus', 'mouse', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi'],
  'handy-telefon': ['handy', 'smartphone', 'iphone', 'galaxy', 'pixel', 'telefon', 'mobile', 'samsung', 'huawei', 'xiaomi', 'oppo', 'oneplus', 'sony xperia'],
  'foto-optik': ['kamera', 'camera', 'spiegelreflex', 'objektiv', 'lens', 'canon', 'nikon', 'sony alpha', 'fuji', 'fujifilm', 'leica', 'panasonic', 'olympus', 'pentax', 'eos', 'lumix', 'gopro', 'drohne', 'drone', 'dji'],
  'sport': ['fahrrad', 'velo', 'rennrad', 'mountainbike', 'e-bike', 'fitness', 'ski', 'snowboard', 'camping', 'outdoor', 'trek', 'specialized', 'canyon', 'scott', 'cube', 'giant', 'garmin'],
  'kleidung-accessoires': ['jacke', 'jacket', 'hose', 'pants', 'shirt', 'hemd', 'pullover', 'schuhe', 'shoes', 'sneaker', 'tasche', 'bag', 'rucksack', 'nike', 'adidas', 'gucci', 'prada', 'louis vuitton', 'balenciaga', 'moncler'],
  'haushalt-wohnen': ['möbel', 'furniture', 'sofa', 'couch', 'tisch', 'table', 'stuhl', 'chair', 'lampe', 'lamp', 'teppich', 'carpet', 'küche', 'kitchen', 'staubsauger', 'vacuum', 'dyson', 'miele', 'kaffeemaschine', 'nespresso', 'jura'],
  'handwerk-garten': ['werkzeug', 'bohrmaschine', 'säge', 'hammer', 'schraubenzieher', 'rasenmäher', 'garten', 'grill', 'weber', 'bosch professional', 'makita', 'dewalt', 'stihl', 'husqvarna'],
  'games-konsolen': ['playstation', 'xbox', 'nintendo', 'switch', 'ps5', 'ps4', 'konsole', 'console', 'game', 'gaming'],
  'musik-instrumente': ['gitarre', 'guitar', 'piano', 'klavier', 'keyboard', 'schlagzeug', 'drums', 'yamaha', 'fender', 'gibson', 'roland'],
}

// Umfangreiches Synonym-Mapping für intelligente Suche
// Unterstützt: Plural/Singular, Umlaute, Mehrsprachigkeit, Tippfehler, Markennamen
const searchSynonyms: Record<string, string[]> = {
  // SCHUHE & BEKLEIDUNG
  'schuhe': ['sneaker', 'shoes', 'sneakers', 'turnschuhe', 'sportschuhe', 'laufschuhe', 'sportschuh', 'sportsschuhe', 'sneakers', 'sneaker', 'sportschuhe', 'laufschuhe', 'wanderschuhe', 'trekking', 'stiefel', 'boots', 'stiefeln', 'sandalen', 'sandals', 'pumps', 'heels', 'absätze', 'loafers', 'oxfords', 'brogues', 'espadrilles', 'flipflops', 'badelatschen', 'hausschuhe', 'slippers', 'clogs', 'mokassins', 'moccasins'],
  'sneaker': ['schuhe', 'shoes', 'sneakers', 'turnschuhe', 'sportschuhe', 'laufschuhe', 'sportschuh', 'trainingsschuhe', 'trainer', 'sneakers'],
  'shoes': ['schuhe', 'sneaker', 'sneakers', 'turnschuhe', 'sportschuhe'],
  'jacke': ['jacket', 'jacken', 'jackets', 'mantel', 'coat', 'mäntel', 'coats', 'parka', 'parkas', 'windjacke', 'windbreaker', 'regenjacke', 'rainjacket', 'daunenjacke', 'downjacket', 'winterjacke', 'winterjacket'],
  'hose': ['pants', 'hosen', 'trousers', 'jeans', 'jean', 'chino', 'chinos', 'cargo', 'cargohose', 'cargopants', 'jogginghose', 'sweatpants', 'leggings', 'legging'],
  'shirt': ['hemd', 'hemden', 'shirts', 't-shirt', 'tshirt', 't-shirts', 'tshirts', 'polo', 'poloshirt', 'poloshirts', 'henley', 'henleys', 'tanktop', 'tanktops'],
  'pullover': ['sweater', 'sweaters', 'pullis', 'pulli', 'hoodie', 'hoodies', 'kapuzenpullover', 'sweatshirt', 'sweatshirts', 'cardigan', 'cardigans', 'strickjacke', 'strickjacken'],
  
  // UHREN & SCHMUCK
  'uhr': ['watch', 'armbanduhr', 'wristwatch', 'zeitmesser', 'uhren', 'watches', 'wristwatches', 'zeitmesser', 'taschenuhr', 'pocketwatch', 'wanduhr', 'wallclock', 'standuhr', 'grandfatherclock', 'wecker', 'alarmclock', 'chronograph', 'chronographen', 'taucheruhr', 'divewatch', 'diverwatch', 'fliegeruhr', 'pilotwatch', 'sportuhr', 'sportwatch'],
  'watch': ['uhr', 'armbanduhr', 'wristwatch', 'uhren', 'watches'],
  'armbanduhr': ['uhr', 'watch', 'wristwatch', 'armbanduhren', 'watches'],
  'schmuck': ['jewelry', 'jewellery', 'bijoux', 'ring', 'rings', 'ringe', 'kette', 'ketten', 'necklace', 'necklaces', 'halskette', 'halsketten', 'ohrring', 'ohrringe', 'earring', 'earrings', 'armband', 'armbänder', 'bracelet', 'bracelets', 'anhänger', 'pendant', 'pendants', 'brosche', 'broschen', 'brooch', 'brooches'],
  'ring': ['rings', 'ringe', 'verlobungsring', 'engagementring', 'ehering', 'weddingring', 'trauring', 'trauringe'],
  'kette': ['ketten', 'necklace', 'necklaces', 'halskette', 'halsketten', 'chain', 'chains'],
  
  // AUTO & MOTORRAD
  'auto': ['fahrzeug', 'wagen', 'pkw', 'car', 'vehicle', 'fahrzeuge', 'wagen', 'cars', 'vehicles', 'automobil', 'automobile', 'kfz', 'kraftfahrzeug', 'kraftfahrzeuge'],
  'fahrzeug': ['auto', 'wagen', 'pkw', 'car', 'vehicle', 'automobil'],
  'motorrad': ['motorcycle', 'bike', 'motorrad', 'motorräder', 'motorcycles', 'bikes', 'moped', 'mopeds', 'roller', 'scooter', 'scooters', 'quad', 'quads', 'atv', 'dirtbike', 'dirtbikes', 'enduro', 'enduros', 'cross', 'crosser', 'yamaha', 'honda', 'kawasaki', 'suzuki', 'ducati', 'ktm', 'triumph', 'bmw motorrad', 'bmw motorrad', 'harley', 'harley davidson', 'harleydavidson', 'aprilia', 'moto guzzi', 'motoguzzi', 'mv agusta', 'mvagusta', 'indian', 'royal enfield', 'royalenfield', 'husqvarna', 'beta', 'gasgas', 'ktm', 'ktms'],
  'motorcycle': ['motorrad', 'bike', 'motorräder', 'bikes', 'yamaha', 'honda', 'kawasaki', 'suzuki', 'ducati'],
  'yamaha': ['yamaha', 'yamahas', 'motorrad', 'motorcycle', 'bike', 'motorcycles', 'bikes', 'yzf', 'r1', 'r6', 'mt', 'xt', 'ténéré', 'tenere', 'super tenere', 'supertenere'],
  'honda': ['honda', 'hondas', 'motorrad', 'motorcycle', 'bike', 'motorcycles', 'bikes', 'cbr', 'cb', 'crf', 'africa twin', 'africatwin', 'gold wing', 'goldwing', 'rebel', 'rebel'],
  'kawasaki': ['kawasaki', 'kawasakis', 'motorrad', 'motorcycle', 'bike', 'motorcycles', 'bikes', 'ninja', 'ninjas', 'z', 'versys', 'klr', 'concours'],
  'suzuki': ['suzuki', 'suzukis', 'motorrad', 'motorcycle', 'bike', 'motorcycles', 'bikes', 'gsx', 'v-strom', 'vstrom', 'bandit', 'hayabusa', 'hayabusas'],
  'ducati': ['ducati', 'ducatis', 'motorrad', 'motorcycle', 'bike', 'motorcycles', 'bikes', 'panigale', 'panigales', 'monster', 'monsters', 'multistrada', 'multistradas', 'scrambler', 'scramblers'],
  'bike': ['fahrrad', 'velo', 'bicycle', 'bikes', 'fahrräder', 'velos', 'bicycles', 'rennrad', 'racingbike', 'mountainbike', 'mtb', 'e-bike', 'ebike', 'elektrofahrrad', 'elektrobike'],
  'fahrrad': ['velo', 'bicycle', 'bike', 'fahrräder', 'velos', 'bicycles', 'bikes', 'rennrad', 'racingbike', 'mountainbike', 'mtb'],
  'velo': ['fahrrad', 'bicycle', 'bike', 'fahrräder', 'bicycles', 'bikes'],
  
  // COMPUTER & ELEKTRONIK
  'laptop': ['notebook', 'computer', 'pc', 'laptops', 'notebooks', 'computers', 'pcs', 'macbook', 'macbooks', 'thinkpad', 'thinkpads', 'ultrabook', 'ultrabooks', 'chromebook', 'chromebooks'],
  'notebook': ['laptop', 'computer', 'pc', 'laptops', 'notebooks', 'computers'],
  'computer': ['pc', 'laptop', 'notebook', 'desktop', 'computers', 'pcs', 'laptops', 'notebooks', 'desktops', 'rechner', 'rechners'],
  'pc': ['computer', 'laptop', 'notebook', 'desktop', 'rechner'],
  'handy': ['smartphone', 'telefon', 'mobile', 'phone', 'handys', 'smartphones', 'telefone', 'mobiles', 'phones', 'mobiltelefon', 'mobiltelefone', 'handytelefon', 'handytelefone', 'iphone', 'iphones', 'galaxy', 'galaxys', 'pixel', 'pixels'],
  'smartphone': ['handy', 'telefon', 'mobile', 'phone', 'iphone', 'galaxy', 'pixel'],
  'telefon': ['handy', 'smartphone', 'mobile', 'phone', 'telefone', 'handys', 'smartphones'],
  'tablet': ['ipad', 'tablets', 'ipads', 'tabletcomputer', 'tabletcomputer', 'slate', 'slates'],
  'ipad': ['tablet', 'tablets', 'ipads'],
  'monitor': ['bildschirm', 'screen', 'displays', 'monitore', 'bildschirme', 'screens', 'display', 'bildschirm'],
  'bildschirm': ['monitor', 'screen', 'display', 'monitore', 'screens', 'displays'],
  'drucker': ['printer', 'drucker', 'printers', 'laserdrucker', 'laserprinter', 'tintenstrahldrucker', 'inkjetprinter', 'multifunktionsdrucker', 'multifunctionprinter'],
  'printer': ['drucker', 'druckers', 'printers'],
  
  // FOTO & OPTIK
  'kamera': ['camera', 'kameras', 'cameras', 'fotokamera', 'photocamera', 'spiegelreflexkamera', 'dslr', 'dslrs', 'systemkamera', 'mirrorless', 'kompaktkamera', 'compactcamera', 'bridgekamera', 'bridgecamera', 'actioncam', 'actioncams', 'gopro', 'gopros'],
  'camera': ['kamera', 'kameras', 'cameras'],
  'objektiv': ['lens', 'lenses', 'objektive', 'objektivs', 'glas', 'gläser', 'optik', 'optiken'],
  'lens': ['objektiv', 'objektive', 'lenses'],
  'drohne': ['drone', 'drohnen', 'drones', 'quadcopter', 'quadcopters', 'multicopter', 'multicopters', 'fpv', 'fpvdrone', 'fpvdrones'],
  'drone': ['drohne', 'drohnen', 'drones'],
  
  // SPORT
  'ski': ['skis', 'skier', 'ski', 'skibretter', 'skiboard', 'skiboards', 'alpin', 'alpine', 'langlauf', 'crosscountry', 'nordic', 'nordicski'],
  'snowboard': ['snowboards', 'snowboard', 'board', 'boards', 'snowboardbrett', 'snowboardbretter'],
  'fahrrad': ['velo', 'bicycle', 'bike', 'fahrräder', 'velos', 'bicycles', 'bikes', 'rennrad', 'racingbike', 'mountainbike', 'mtb', 'e-bike', 'ebike', 'elektrofahrrad', 'elektrobike'],
  'fitness': ['fitnessgerät', 'fitnessgeräte', 'fitnessequipment', 'trainingsgerät', 'trainingsgeräte', 'trainingsequipment', 'trainer', 'trainers', 'heimtrainer', 'hometrainer', 'crosstrainer', 'elliptical', 'laufband', 'treadmill', 'rudergerät', 'rowingmachine', 'hanteln', 'dumbbells', 'gewichte', 'weights'],
  
  // HAUSHALT & WOHNEN
  'möbel': ['furniture', 'möbel', 'furnitures', 'einrichtung', 'furnishings', 'sofa', 'sofas', 'couch', 'couches', 'sessel', 'armchair', 'armchairs', 'stuhl', 'stühle', 'chair', 'chairs', 'tisch', 'tische', 'table', 'tables', 'schrank', 'schränke', 'cabinet', 'cabinets', 'regal', 'regale', 'shelf', 'shelves', 'bett', 'betten', 'bed', 'beds', 'kommode', 'kommoden', 'chest', 'chests'],
  'sofa': ['couch', 'sofas', 'couches', 'sitzgarnitur', 'sitzgarnituren', 'sitzgruppe', 'sitzgruppen'],
  'couch': ['sofa', 'sofas', 'couches'],
  'tisch': ['table', 'tables', 'tische', 'tischs'],
  'stuhl': ['chair', 'chairs', 'stühle', 'stuhls'],
  'lampe': ['lamp', 'lamps', 'lampen', 'leuchte', 'leuchten', 'light', 'lights', 'beleuchtung', 'lighting'],
  'staubsauger': ['vacuum', 'vacuums', 'staubsauger', 'staubsaugers', 'sauger', 'saugers', 'saugroboter', 'robovac', 'robovacs', 'roomba', 'roombas'],
  'vacuum': ['staubsauger', 'staubsaugers', 'vacuums'],
  
  // HANDWERK & GARTEN
  'werkzeug': ['tool', 'tools', 'werkzeuge', 'werkzeugs', 'werkzeugkasten', 'toolbox', 'toolboxes', 'bohrmaschine', 'drill', 'drills', 'bohrer', 'drills', 'schraubenzieher', 'screwdriver', 'screwdrivers', 'hammer', 'hammers', 'hämmer', 'säge', 'saw', 'saws', 'sägen'],
  'garten': ['garden', 'gardens', 'gärten', 'gartens', 'rasenmäher', 'lawnmower', 'lawnmowers', 'rasenmähers', 'gartenmöbel', 'gardenfurniture', 'gartengerät', 'gardentool', 'gardentools'],
  'grill': ['grills', 'barbecue', 'barbecues', 'bbq', 'bbqs', 'grillgerät', 'grillgeräte', 'grillgeräts'],
  
  // GAMES & KONSOLEN
  'konsole': ['console', 'consoles', 'konsolen', 'konsoles', 'spielkonsole', 'gameconsole', 'gameconsoles', 'playstation', 'ps', 'ps5', 'ps4', 'ps3', 'xbox', 'nintendo', 'switch', 'wii', 'wiiu', 'gamecube', 'n64', 'snes', 'nes'],
  'console': ['konsole', 'konsolen', 'consoles'],
  'playstation': ['ps', 'ps5', 'ps4', 'ps3', 'playstation', 'playstations'],
  'xbox': ['xboxs', 'xbox', 'xboxseriesx', 'xboxseriess', 'xboxone', 'xbox360'],
  'nintendo': ['nintendos', 'nintendo', 'switch', 'switches', 'wii', 'wiis', 'wiiu', 'gamecube', 'n64', 'snes', 'nes'],
  'spiel': ['game', 'games', 'spiele', 'spiels', 'videospiel', 'videogame', 'videogames', 'computerspiel', 'computergame', 'computergames'],
  'game': ['spiel', 'spiele', 'games'],
  
  // MUSIK & INSTRUMENTE
  'gitarre': ['guitar', 'guitars', 'gitarren', 'gitarres', 'elektrogitarre', 'electricguitar', 'electricguitars', 'akustikgitarre', 'acousticguitar', 'acousticguitars', 'bassgitarre', 'bassguitar', 'bassguitars', 'e-gitarre', 'eguitar', 'eguitars'],
  'guitar': ['gitarre', 'gitarren', 'guitars'],
  'piano': ['klavier', 'klaviere', 'pianos', 'flügel', 'grandpiano', 'grandpianos', 'flügels', 'keyboard', 'keyboards', 'keyboards', 'digitalpiano', 'digitalpianos'],
  'klavier': ['piano', 'pianos', 'klaviere'],
  'keyboard': ['keyboards', 'keyboards', 'tastatur', 'tastaturen', 'keyboards'],
  'schlagzeug': ['drums', 'drumset', 'drumsets', 'schlagzeuge', 'schlagzeugs', 'trommel', 'trommeln', 'drums', 'percussion', 'percussions'],
  'drums': ['schlagzeug', 'schlagzeuge', 'drums'],
  
  // MARKENNAMEN (häufige Suchbegriffe)
  'nike': ['nike', 'nikee', 'nikes', 'swoosh'],
  'adidas': ['adidas', 'adidass', 'adidases', 'drei streifen', 'threestripes'],
  'new balance': ['newbalance', 'nb', 'newbalances', 'newbalances'],
  'puma': ['pumas', 'puma'],
  'reebok': ['reeboks', 'reebok'],
  'converse': ['converses', 'chuck taylor', 'chucktaylor', 'all star', 'allstar'],
  'vans': ['vanss', 'vans', 'old skool', 'oldskool', 'authentic', 'authentics'],
  'jordan': ['air jordan', 'airjordan', 'jordans', 'aj', 'aj1', 'aj4', 'aj11'],
  'yeezy': ['yeezys', 'yeezy', 'kanye', 'kanyes'],
  'balenciaga': ['balenciagas', 'balenciaga', 'triple s', 'triples'],
  'gucci': ['guccis', 'gucci'],
  'prada': ['pradas', 'prada'],
  'louis vuitton': ['lv', 'louisvuitton', 'louisvuittons'],
  'hermes': ['hermès', 'hermes', 'hermess'],
  'chanel': ['chanels', 'chanel'],
  'dior': ['diors', 'dior'],
  'versace': ['versaces', 'versace'],
  'rolex': ['rolex', 'rolexs', 'rolexes', 'crown', 'crowns', 'submariner', 'submariners', 'datejust', 'datejusts', 'daytona', 'daytonas', 'gmt', 'gmts', 'explorer', 'explorers'],
  'omega': ['omega', 'omegas', 'speedmaster', 'speedmasters', 'seamaster', 'seamasters', 'constellation', 'constellations'],
  'patek philippe': ['patek', 'pateks', 'pp', 'pps', 'patekphilippe', 'patekphilippes'],
  'audemars piguet': ['ap', 'aps', 'audemars', 'audemarspiguet', 'royal oak', 'royaloak', 'royaloaks'],
  'breitling': ['breitlings', 'breitling', 'navitimer', 'navitimers', 'superocean', 'superoceans'],
  'tag heuer': ['tag', 'tags', 'tagheuer', 'tagheuers', 'carrera', 'carreras', 'monaco', 'monacos'],
  'cartier': ['cartiers', 'cartier', 'santos', 'santoss', 'tank', 'tanks', 'ballon bleu', 'ballonbleu'],
  'iwc': ['iwcs', 'iwc', 'portugieser', 'portugiesers', 'pilot', 'pilots', 'aquatimer', 'aquatimers'],
  'panerai': ['panerais', 'panerai', 'luminor', 'luminors', 'radiomir', 'radiomirs'],
  'tudor': ['tudors', 'tudor', 'black bay', 'blackbay', 'blackbays', 'pelagos', 'pelagoss'],
  'longines': ['longiness', 'longines', 'hydroconquest', 'hydroconquests', 'master collection', 'mastercollection'],
  'tissot': ['tissots', 'tissot', 'prx', 'prxs', 'seastar', 'seastars'],
  'seiko': ['seikos', 'seiko', 'grand seiko', 'grandseiko', 'grandseikos', 'prospex', 'prospexs'],
  'citizen': ['citizens', 'citizen', 'eco drive', 'ecodrive', 'promaster', 'promasters'],
  'casio': ['casios', 'casio', 'g shock', 'gshock', 'gshocks', 'edifice', 'edifices'],
  'apple': ['apple', 'apples', 'iphone', 'iphones', 'ipad', 'ipads', 'macbook', 'macbooks', 'imac', 'imacs', 'mac', 'macs'],
  'samsung': ['samsung', 'samsungs', 'galaxy', 'galaxys', 'galaxie', 'galaxies'],
  'sony': ['sonys', 'sony', 'playstation', 'playstations'],
  'canon': ['canons', 'canon', 'eos', 'eoss'],
  'nikon': ['nikons', 'nikon', 'd', 'dslr'],
  'bmw': ['bmw', 'bmws', 'bayerische motoren werke', 'bavarian motor works'],
  'mercedes': ['mercedes', 'mercedess', 'mercedesbenz', 'mercedes-benz', 'benz', 'benzes', 'amg', 'amgs'],
  'audi': ['audi', 'audis', 'audies', 'quattro', 'quattros'],
  'porsche': ['porsche', 'porsches', 'porsches', '911', 'cayenne', 'macan', 'panamera'],
  'tesla': ['tesla', 'teslas', 'model s', 'model3', 'model y', 'modelx', 'cybertruck', 'models', 'modely', 'modelx'],
  'ford': ['fords', 'ford', 'mustang', 'mustangs', 'f150', 'focus', 'foci'],
  'toyota': ['toyotas', 'toyota', 'corolla', 'corollas', 'camry', 'camrys', 'prius', 'priuses'],
  'honda': ['hondas', 'honda', 'civic', 'civics', 'accord', 'accords', 'crv', 'crvs'],
  'volkswagen': ['vw', 'vws', 'volkswagen', 'golf', 'golfs', 'passat', 'passats', 'tiguan', 'tiguans'],
  'volvo': ['volvos', 'volvo', 'xc90', 'xc90s', 'xc60', 'xc60s'],
  
  // WEITERE HÄUFIGE BEGRIFFE
  'neu': ['new', 'neue', 'neues', 'neuer', 'neuen', 'brandneu', 'brandnew', 'fabrikneu', 'factorynew', 'unbenutzt', 'unused'],
  'gebraucht': ['used', 'gebrauchte', 'gebrauchtes', 'gebrauchter', 'gebrauchten', 'secondhand', 'second hand', 'vorgebraucht', 'preowned', 'pre-owned'],
  'wie neu': ['like new', 'wie neu', 'wie neues', 'wie neuer', 'wie neuen', 'as new', 'wie neu'],
  'sehr gut': ['very good', 'sehr gut', 'sehr gute', 'sehr gutes', 'sehr guter', 'sehr guten', 'vg', 'vg+'],
  'gut': ['good', 'gut', 'gute', 'gutes', 'guter', 'guten'],
  
  // PLURAL/SINGULAR & VARIANTEN
  'artikel': ['article', 'articles', 'artikels', 'produkt', 'produkte', 'products', 'product', 'ware', 'waren', 'goods', 'good', 'item', 'items', 'gegenstand', 'gegenstände', 'objects', 'object'],
  'produkt': ['product', 'products', 'produkte', 'artikel', 'articles', 'ware', 'waren'],
  'ware': ['good', 'goods', 'waren', 'produkt', 'products', 'artikel', 'articles'],
}

// Hilfsfunktion: Normalisiert Umlaute (ä->ae, ö->oe, ü->ue)
function normalizeUmlauts(text: string): string {
  return text
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
}

// Hilfsfunktion: Erstellt Plural- und Singular-Varianten
function getPluralSingularVariants(word: string): string[] {
  const variants: string[] = [word]
  
  // Deutsche Plural-Regeln
  if (word.endsWith('e')) {
    variants.push(word + 'n') // Auto -> Autos (aber auch Auto -> Autos)
  }
  if (word.endsWith('er') || word.endsWith('el') || word.endsWith('en')) {
    variants.push(word) // Singular = Plural
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
    variants.push(word) // Singular = Plural
  }
  
  // Englische Plural-Regeln
  if (word.endsWith('y')) {
    variants.push(word.slice(0, -1) + 'ies') // city -> cities
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    variants.push(word + 'es') // box -> boxes
  }
  if (!word.endsWith('s')) {
    variants.push(word + 's') // car -> cars
  }
  
  // Entferne 's' für Singular
  if (word.endsWith('s') && word.length > 1) {
    variants.push(word.slice(0, -1)) // cars -> car
  }
  if (word.endsWith('es') && word.length > 2) {
    variants.push(word.slice(0, -2)) // boxes -> box
  }
  if (word.endsWith('ies') && word.length > 3) {
    variants.push(word.slice(0, -3) + 'y') // cities -> city
  }
  
  return [...new Set(variants)]
}

// Hilfsfunktion: Erweitert Suchbegriffe um Synonyme, Plural/Singular, Umlaute
// INTELLIGENT: Fügt auch kategoriebasierte Marken hinzu
function expandSearchTerms(queryWords: string[]): string[] {
  const expanded: string[] = []
  
  for (const word of queryWords) {
    const wordLower = word.toLowerCase().trim()
    if (wordLower.length < 2) continue
    
    // Füge Original-Wort hinzu
    expanded.push(wordLower)
    
    // Füge Umlaut-Normalisierung hinzu
    const normalized = normalizeUmlauts(wordLower)
    if (normalized !== wordLower) {
      expanded.push(normalized)
    }
    
    // Füge Plural/Singular-Varianten hinzu
    const pluralSingular = getPluralSingularVariants(wordLower)
    expanded.push(...pluralSingular)
    
    // Füge Synonyme hinzu
    if (searchSynonyms[wordLower]) {
      expanded.push(...searchSynonyms[wordLower])
    }
    
    // Prüfe auch ohne Umlaute für Synonyme
    if (normalized !== wordLower && searchSynonyms[normalized]) {
      expanded.push(...searchSynonyms[normalized])
    }
    
    // INTELLIGENT: Füge kategoriebasierte Marken hinzu
    // Wenn jemand nach "motorrad" sucht, sollten auch Motorrad-Marken gefunden werden
    for (const [categorySlug, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.includes(wordLower) || keywords.includes(normalized)) {
        // Füge alle Marken dieser Kategorie hinzu
        expanded.push(...keywords.filter(k => k.length >= 2))
      }
    }
  }
  
  // Entferne Duplikate und kurze Wörter
  return [...new Set(expanded)].filter(w => w.length >= 2)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const subcategory = searchParams.get('subcategory') || ''
    const isAuction = searchParams.get('isAuction')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const condition = searchParams.get('condition')
    const brand = searchParams.get('brand')
    const postalCode = searchParams.get('postalCode')
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[SEARCH] Search params:', { query, category, subcategory, isAuction, minPrice, maxPrice, condition, brand, postalCode })

    const now = new Date()
    
    // Intelligente Such-Logik: Hole alle verfügbaren Artikel
    // RICARDO-STYLE: Stornierte Purchases machen das Watch wieder verfügbar
    // Ein Watch ist verfügbar wenn:
    // 1. Keine Purchases vorhanden sind ODER
    // 2. Alle Purchases storniert sind (status = 'cancelled')
    // 3. Beendete Auktionen ohne Purchase werden ausgeschlossen
    const whereClause: any = {
      AND: [
        {
          OR: [
            {
              purchases: {
                none: {} // Keine Purchases vorhanden
              }
            },
            {
              purchases: {
                every: {
                  status: 'cancelled' // Alle Purchases sind storniert
                }
              }
            }
          ]
        },
        {
          // Beendete Auktionen ohne Purchase ausschließen
          OR: [
            // Keine Auktion (Sofortkauf)
            { auctionEnd: null },
            // Oder Auktion noch nicht abgelaufen
            { auctionEnd: { gt: now } },
            // Oder Auktion abgelaufen, aber bereits ein Purchase vorhanden
            {
              AND: [
                { auctionEnd: { lte: now } },
                {
                  purchases: {
                    some: {
                      status: {
                        not: 'cancelled'
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
    
    // Filter nach Angebotsart (Auktion oder Sofortkauf)
    if (isAuction === 'true') {
      // Eine Auktion ist aktiv wenn:
      // 1. isAuction = true
      // 2. auctionEnd > now (noch nicht abgelaufen)
      // 3. UND (auctionStart ist null ODER auctionStart <= now) - Auktion hat begonnen
      whereClause.AND.push({
        isAuction: true
      })
      whereClause.AND.push({
        auctionEnd: {
          gt: now // Noch nicht abgelaufen
        }
      })
      whereClause.AND.push({
        OR: [
          { auctionStart: null }, // Kein Starttermin = startet sofort
          { auctionStart: { lte: now } } // Starttermin ist erreicht oder in der Vergangenheit
        ]
      })
    } else if (isAuction === 'false') {
      whereClause.AND.push({
        isAuction: false
      })
    }
    
    // Zustand-Filter
    if (condition) {
      whereClause.AND.push({
        condition: condition
      })
    }
    
    // Marke-Filter - Exakte Übereinstimmung (case-insensitive)
    if (brand) {
      whereClause.AND.push({
        brand: {
          equals: brand,
          mode: 'insensitive'
        }
      })
    }
    
    // Standort-Filter (Postleitzahl)
    if (postalCode) {
      whereClause.AND.push({
        seller: {
          postalCode: {
            contains: postalCode,
            mode: 'insensitive'
          }
        }
      })
    }
    
    // Kategorie-Filter über Relation (categories -> category.slug)
    // WICHTIG: Wir fügen den Filter hinzu, aber wenn keine Ergebnisse gefunden werden,
    // verwenden wir später einen Fallback auf Keyword-basierte Filterung
    // Daher entfernen wir den Filter NICHT aus der WHERE-Klausel, sondern filtern später zusätzlich
    // Dies ermöglicht es, auch Watches ohne Kategorie-Verknüpfung zu finden (via Keywords)
    // if (category) {
    //   // Kategorie-Filter wird später nach dem Laden angewendet (mit Fallback)
    //   // Dies ermöglicht es, auch Watches ohne Kategorie-Verknüpfung zu finden
    // }
    
    console.log('[SEARCH] WHERE clause:', JSON.stringify(whereClause, null, 2))
    
    // Hole alle verfügbaren Watches basierend auf WHERE-Klausel
    let watches: any[] = []
    
    watches = await prisma.watch.findMany({
      where: whereClause,
      include: {
        bids: {
          orderBy: { amount: 'desc' }
        },
        seller: {
          select: {
            id: true,
            email: true,
            city: true,
            postalCode: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        purchases: {
          // Lade ALLE Purchases, um korrekt filtern zu können
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Erhöhe Limit für bessere Ergebnisse
    })
    
    // Filtere Watches ohne gültigen Seller heraus
    watches = watches.filter((w: any) => w.seller && w.seller.id)
    
    console.log(`[SEARCH] Prisma query result: ${watches.length} watches (category: ${category || 'none'})`)
    
    // Filtere verkaufte Produkte raus
    // RICARDO-STYLE: Nur nicht-stornierte Purchases zählen als "verkauft"
    const beforePurchaseFilter = watches.length
    watches = watches.filter((watch: any) => {
      try {
        if (!watch.purchases || !Array.isArray(watch.purchases) || watch.purchases.length === 0) {
          return true // Keine Purchases = verfügbar
        }
        // Prüfe ob es aktive (nicht-stornierte) Purchases gibt
        const activePurchases = watch.purchases.filter((p: any) => p && p.status && p.status !== 'cancelled')
        if (activePurchases.length > 0) {
          return false // Hat aktive Purchases = verkauft
        }
        return true // Alle Purchases sind storniert = verfügbar
      } catch (e) {
        console.error('Error filtering purchases:', e, 'watch:', watch?.id)
        return true // Bei Fehler: behalte das Produkt
      }
    })
    console.log(`[SEARCH] Purchase filter: ${beforePurchaseFilter} -> ${watches.length} watches`)

    // Wenn Suchbegriff vorhanden, filtere intelligent mit Relevanz-Ranking
    if (query) {
      const q = query.trim()
      const qLower = q.toLowerCase()
      const queryWords = qLower.split(/\s+/).filter(w => w.length > 0)
      
      // Prüfe ob es eine Artikelnummer ist
      const isNumericArticleNumber = /^\d{6,10}$/.test(q) // 6-10 stellige Nummer
      const isCuid = q.length >= 20 && q.startsWith('c')
      const isLongId = q.length >= 20 && /^[a-z0-9]{20,}$/i.test(q)
      
      if (isNumericArticleNumber || isCuid || isLongId) {
        // Suche nach Artikelnummer ODER ID
        const searchWhereClause: any = {
          AND: [
            {
              OR: [
                {
                  purchases: {
                    none: {}
                  }
                },
                {
                  purchases: {
                    every: {
                      status: 'cancelled'
                    }
                  }
                }
              ]
            }
          ]
        }
        
        if (isNumericArticleNumber) {
          searchWhereClause.AND.push({
            articleNumber: parseInt(q)
          })
        } else {
          searchWhereClause.AND.push({
            id: q
          })
        }
        
        const watchById = await prisma.watch.findFirst({
          where: searchWhereClause,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                nickname: true,
                city: true,
                postalCode: true,
                verified: true,
                verificationStatus: true
              }
            },
            categories: {
              include: {
                category: true
              }
            },
            bids: {
              orderBy: { amount: 'desc' },
              take: 1
            },
            purchases: {
              where: {
                status: {
                  not: 'cancelled'
                }
              }
            }
          }
        })
        
        if (watchById) {
          // Prüfe ob Watch verkauft ist
          if (watchById.purchases && watchById.purchases.length > 0) {
            // Watch ist verkauft
            return NextResponse.json({
              watches: [],
              total: 0
            })
          }
          
          // Parse images und boosters
          let images: string[] = []
          let boosters: string[] = []
          try {
            if (watchById.images) images = JSON.parse(watchById.images)
            if (watchById.boosters) boosters = JSON.parse(watchById.boosters)
          } catch (e) {
            console.error('Error parsing watch data:', e)
          }
          
          const highestBid = watchById.bids?.[0]
          const currentPrice = highestBid ? highestBid.amount : watchById.price
          
          return NextResponse.json({
            watches: [{
              ...watchById,
              images,
              boosters,
              price: currentPrice,
              city: watchById.seller?.city || null,
              postalCode: watchById.seller?.postalCode || null
            }],
            total: 1,
            limit,
            offset
          })
        }
        
        // Wenn keine direkte ID gefunden, suche weiter normal
      }
      
      // Erweitere Query-Wörter um Synonyme, Plural/Singular, Umlaute
      const expandedQueryWords = expandSearchTerms(queryWords)
      
      console.log(`[SEARCH] Original query words: ${queryWords.join(', ')}`)
      console.log(`[SEARCH] Expanded query words: ${expandedQueryWords.slice(0, 20).join(', ')}... (${expandedQueryWords.length} total)`)
      
      // Verbesserte präzise Suche mit intelligenter Relevanz-Berechnung
      // WICHTIG: Booster beeinflussen nur die Sortierung, NICHT die Filterung!
      const watchesWithScore = watches.map(watch => {
        // Parse boosters für Priorität (nur für Sortierung)
        let boosters: string[] = []
        try {
          if ((watch as any).boosters) {
            boosters = JSON.parse((watch as any).boosters)
          }
        } catch (e) {
          boosters = []
        }
        
        const brandLower = (watch.brand || '').toLowerCase().trim()
        const modelLower = (watch.model || '').toLowerCase().trim()
        const titleLower = (watch.title || '').toLowerCase().trim()
        const descLower = (watch.description || '').toLowerCase().trim()
        const refLower = (watch.referenceNumber || '').toLowerCase().trim()
        
        const searchText = `${brandLower} ${modelLower} ${titleLower} ${descLower} ${refLower}`
        let relevanceScore = 0
        let matches = false
        
        // WICHTIG: Prüfe zuerst, ob das Watch zur Suche passt (OHNE Booster-Bonus)
        // Exakte Übereinstimmung (höchste Priorität)
        const normalizedQ = normalizeUmlauts(qLower)
        const normalizedSearchText = normalizeUmlauts(searchText)
        
        if (searchText === q || normalizedSearchText === normalizedQ || 
            brandLower === q || modelLower === q || titleLower === q ||
            normalizedSearchText.includes(normalizedQ) || searchText.includes(qLower)) {
          relevanceScore = 1000
          matches = true
        } else {
          // Multi-Wort Matching mit Gewichtung und Synonymen
          // INTELLIGENT: Zähle sowohl Original-Wörter als auch Synonyme als Match
          let originalWordsMatched = new Set<string>()
          let synonymWordsMatched = new Set<string>()
          let exactWordMatches = 0
          const matchedFields = new Set<string>()
          
          // Prüfe sowohl Original-Wörter als auch Synonyme
          for (const word of expandedQueryWords) {
            if (word.length < 2) continue
            
            const isOriginalWord = queryWords.includes(word)
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const exactMatchRegex = new RegExp(`\\b${escapedWord}\\b`, 'i')
            const partialMatchRegex = new RegExp(escapedWord, 'i')
            
            // Normalisiere auch für Umlaute
            const normalizedWord = normalizeUmlauts(word)
            const normalizedExactMatchRegex = normalizedWord !== word ? new RegExp(`\\b${normalizedWord}\\b`, 'i') : null
            const normalizedPartialMatchRegex = normalizedWord !== word ? new RegExp(normalizedWord, 'i') : null
            
            let wordMatched = false
            let wordScore = 0
            
            // Prüfe alle Felder (nicht mit else if, damit alle Felder geprüft werden)
            // Exakte Wort-Übereinstimmung (Word Boundary) - höchste Priorität
            
            // Brand
            if (exactMatchRegex.test(brandLower) || (normalizedExactMatchRegex && normalizedExactMatchRegex.test(normalizeUmlauts(brandLower)))) {
              wordScore = Math.max(wordScore, 150)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('brand')
            } else if (partialMatchRegex.test(brandLower) || (normalizedPartialMatchRegex && normalizedPartialMatchRegex.test(normalizeUmlauts(brandLower)))) {
              wordScore = Math.max(wordScore, 50)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('brand')
            }
            
            // Model
            if (exactMatchRegex.test(modelLower) || (normalizedExactMatchRegex && normalizedExactMatchRegex.test(normalizeUmlauts(modelLower)))) {
              wordScore = Math.max(wordScore, 120)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('model')
            } else if (partialMatchRegex.test(modelLower) || (normalizedPartialMatchRegex && normalizedPartialMatchRegex.test(normalizeUmlauts(modelLower)))) {
              wordScore = Math.max(wordScore, 40)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('model')
            }
            
            // Title
            if (exactMatchRegex.test(titleLower) || (normalizedExactMatchRegex && normalizedExactMatchRegex.test(normalizeUmlauts(titleLower)))) {
              wordScore = Math.max(wordScore, 100)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('title')
            } else if (partialMatchRegex.test(titleLower) || (normalizedPartialMatchRegex && normalizedPartialMatchRegex.test(normalizeUmlauts(titleLower)))) {
              wordScore = Math.max(wordScore, 30)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('title')
            }
            
            // Reference Number
            if (exactMatchRegex.test(refLower) || (normalizedExactMatchRegex && normalizedExactMatchRegex.test(normalizeUmlauts(refLower)))) {
              wordScore = Math.max(wordScore, 90)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('reference')
            } else if (partialMatchRegex.test(refLower) || (normalizedPartialMatchRegex && normalizedPartialMatchRegex.test(normalizeUmlauts(refLower)))) {
              wordScore = Math.max(wordScore, 20)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('reference')
            }
            
            // Description
            if (exactMatchRegex.test(descLower) || (normalizedExactMatchRegex && normalizedExactMatchRegex.test(normalizeUmlauts(descLower)))) {
              wordScore = Math.max(wordScore, 40)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('description')
            } else if (partialMatchRegex.test(descLower) || (normalizedPartialMatchRegex && normalizedPartialMatchRegex.test(normalizeUmlauts(descLower)))) {
              wordScore = Math.max(wordScore, 10)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('description')
            }
            
            relevanceScore += wordScore
          }
          
          // INTELLIGENT: Ein Watch passt zur Suche wenn:
          // 1. Mindestens ein Original-Wort gefunden wurde ODER
          // 2. Mindestens ein Synonym gefunden wurde UND relevanceScore > 0
          // Dies ermöglicht es, dass "motorrad" auch Yamaha-Motorräder findet
          const hasOriginalMatch = originalWordsMatched.size > 0
          const hasSynonymMatch = synonymWordsMatched.size > 0
          
          // Bonus für alle Original-Wörter gefunden
          if (originalWordsMatched.size === queryWords.length && queryWords.length > 1) {
            relevanceScore += 200
          }
          
          // Bonus wenn sowohl Original als auch Synonyme gefunden wurden
          if (hasOriginalMatch && hasSynonymMatch) {
            relevanceScore += 150
          }
          
          // Bonus für viele exakte Wort-Übereinstimmungen
          if (exactWordMatches >= queryWords.length && queryWords.length > 1) {
            relevanceScore += 300
          }
          
          // Bonus für Matches in mehreren Feldern
          if (matchedFields.size > 1) {
            relevanceScore += matchedFields.size * 20
          }
          
          // Bonus für Synonym-Matches (zeigt dass die Suche intelligent war)
          if (hasSynonymMatch && !hasOriginalMatch) {
            relevanceScore += 50 // Bonus für intelligente Synonym-Erkennung
          }
          
          // WICHTIG: matches wird basierend auf Relevanz gesetzt
          // Ein Watch passt zur Suche wenn:
          // - Mindestens ein Original-Wort ODER Synonym gefunden wurde
          // - UND relevanceScore > 0
          matches = relevanceScore > 0 && (hasOriginalMatch || hasSynonymMatch)
        }
        
        // Booster-Bonus wird NUR hinzugefügt, wenn das Watch bereits zur Suche passt
        // Booster beeinflusst nur die Sortierung, nicht die Filterung!
        if (matches) {
          if (boosters.includes('super-boost')) {
            relevanceScore += 10000
          } else if (boosters.includes('turbo-boost')) {
            relevanceScore += 5000
          } else if (boosters.includes('boost')) {
            relevanceScore += 2000
          }
        }
        
        return { watch, relevanceScore, matches, boosters }
      })
      
      // Filtere NUR Watches, die zur Suche passen (matches = true)
      watches = watchesWithScore
        .filter(item => item.matches) // WICHTIG: Nur relevante Watches werden angezeigt
        .sort((a, b) => {
          // Sortiere nach Relevanz-Score (inkl. Booster-Bonus für relevante Watches)
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore
          }
          return new Date(b.watch.createdAt).getTime() - new Date(a.watch.createdAt).getTime()
        })
        .map(item => item.watch)
    } else if (category) {
      // Nur Kategorie-Filter ohne Suchbegriff
      // Sortiere nach Booster-Priorität
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
        return 1
      }
      
      watches = watches.sort((a, b) => {
        let boostersA: string[] = []
        let boostersB: string[] = []
        try {
          if ((a as any).boosters) {
            boostersA = JSON.parse((a as any).boosters)
          }
          if ((b as any).boosters) {
            boostersB = JSON.parse((b as any).boosters)
          }
        } catch (e) {
          // Ignore
        }
        
        const priorityA = getBoostPriority(boostersA)
        const priorityB = getBoostPriority(boostersB)
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    console.log('[SEARCH] Processing watches, query:', query || 'none', 'category:', category || 'none')

    // Konvertiere Bilder von JSON String zu Array und berechne aktuellen Preis
    let watchesWithImages = watches.map((watch: any) => {
      try {
        const highestBid = watch.bids?.[0]
        const currentPrice = highestBid ? highestBid.amount : (watch.price || 0)
        
        // Parse boosters
        let boosters: string[] = []
        try {
          if (watch.boosters) {
            if (Array.isArray(watch.boosters)) {
              boosters = watch.boosters
            } else if (typeof watch.boosters === 'string') {
              boosters = JSON.parse(watch.boosters)
            }
          }
        } catch (e) {
          boosters = []
        }
        
        // Parse images sicher
        let images: string[] = []
        try {
          if (watch.images) {
            if (Array.isArray(watch.images)) {
              images = watch.images
            } else if (typeof watch.images === 'string') {
              if (watch.images.trim().startsWith('[') || watch.images.trim().startsWith('{')) {
                images = JSON.parse(watch.images)
              } else if (watch.images.trim().startsWith('http')) {
                images = [watch.images]
              } else {
                try {
                  images = JSON.parse(watch.images)
                } catch {
                  images = watch.images.trim() ? [watch.images] : []
                }
              }
            }
          }
        } catch (e) {
          if (watch.images && typeof watch.images === 'string' && watch.images.trim().startsWith('http')) {
            images = [watch.images]
          } else {
            images = []
          }
        }
        
        // Extrahiere Kategorie-Slugs für Filterung
        const categorySlugs = watch.categories?.map((cat: any) => cat.category?.slug).filter(Boolean) || []
        
        return {
          id: watch.id,
          title: watch.title || '',
          description: watch.description || '',
          brand: watch.brand || '',
          model: watch.model || '',
          price: currentPrice,
          buyNowPrice: watch.buyNowPrice || null,
          condition: watch.condition || '',
          year: watch.year || null,
          images: images,
          boosters: boosters,
          isAuction: watch.isAuction || false,
          auctionEnd: watch.auctionEnd || null,
          auctionStart: watch.auctionStart || null,
          city: watch.seller?.city || null,
          postalCode: watch.seller?.postalCode || null,
          bids: watch.bids || [],
          createdAt: watch.createdAt,
          updatedAt: watch.updatedAt,
          sellerId: watch.sellerId,
          seller: watch.seller ? {
            city: watch.seller.city,
            postalCode: watch.seller.postalCode
          } : null,
          categorySlugs: categorySlugs
        }
      } catch (e) {
        console.error('Error processing watch:', watch?.id, e)
        return null
      }
    }).filter((w: any) => w !== null)
    
    console.log('[SEARCH] After image processing:', watchesWithImages.length, 'watches')

    // Preis-Filter anwenden (nach Berechnung des aktuellen Preises)
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity
      
      watchesWithImages = watchesWithImages.filter(watch => {
        const currentPrice = watch.price
        return currentPrice >= min && currentPrice <= max
      })
    }
    
    // Kategorie-Filterung: Wenn Kategorie gesetzt ist, filtere nach Kategorie-Verknüpfung ODER Keywords
    // WICHTIG: Wenn keine Watches mit Kategorie-Verknüpfung gefunden werden, verwende IMMER Keyword-Fallback
    if (category) {
      const beforeFilter = watchesWithImages.length
      const categorySlug = category.toLowerCase().trim()
      const categoryVariants = [
        categorySlug,
        category,
        category.toLowerCase(),
        category.toUpperCase(),
        categorySlug.replace(/-/g, '_'),
        categorySlug.replace(/_/g, '-')
      ]
      
      // Prüfe zuerst, ob Watches mit Kategorie-Verknüpfung vorhanden sind
      const watchesWithCategoryLink = watchesWithImages.filter(watch => {
        return watch.categorySlugs?.some(slug => {
          const slugLower = slug?.toLowerCase().trim()
          return categoryVariants.some(variant => {
            const variantLower = variant.toLowerCase().trim()
            return slugLower === variantLower
          })
        })
      })
      
      console.log(`[SEARCH] Watches with category link: ${watchesWithCategoryLink.length} out of ${beforeFilter}`)
      
      // Wenn keine Watches mit Kategorie-Verknüpfung gefunden wurden, verwende IMMER Keyword-Fallback
      if (watchesWithCategoryLink.length === 0) {
        console.log(`[SEARCH] No watches with category link found, using keyword fallback for "${categorySlug}"`)
        const keywords = categoryKeywords[categorySlug] || []
        console.log(`[SEARCH] Using keywords:`, keywords.slice(0, 10))
        
        watchesWithImages = watchesWithImages.filter(watch => {
          const searchText = `${watch.brand || ''} ${watch.model || ''} ${watch.title || ''} ${watch.description || ''}`.toLowerCase()
          const matchesKeywords = keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
          
          if (matchesKeywords) {
            // Wenn Subkategorie angegeben, filtere auch danach
            if (subcategory) {
              const subcatLower = subcategory.toLowerCase()
              return searchText.includes(subcatLower)
            }
            return true
          }
          return false
        })
      } else {
        // Verwende normale Filterung mit Kategorie-Verknüpfung + Fallback
        watchesWithImages = watchesWithImages.filter(watch => {
          // Prüfe ob das Produkt eine Kategorie-Verknüpfung hat
          const hasCategoryLink = watch.categorySlugs?.some(slug => {
            const slugLower = slug?.toLowerCase().trim()
            return categoryVariants.some(variant => {
              const variantLower = variant.toLowerCase().trim()
              return slugLower === variantLower
            })
          })
          
          if (hasCategoryLink) {
            // Wenn Subkategorie angegeben, filtere auch danach
            if (subcategory) {
              const subcatLower = subcategory.toLowerCase()
              const searchText = `${watch.brand || ''} ${watch.model || ''} ${watch.title || ''} ${watch.description || ''}`.toLowerCase()
              return searchText.includes(subcatLower)
            }
            return true
          }
          
          // Fallback: Prüfe ob das Produkt basierend auf Keywords zur Kategorie passt
          const keywords = categoryKeywords[categorySlug] || []
          if (keywords.length > 0) {
            const searchText = `${watch.brand || ''} ${watch.model || ''} ${watch.title || ''} ${watch.description || ''}`.toLowerCase()
            const matchesKeywords = keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
            
            if (matchesKeywords) {
              // Wenn Subkategorie angegeben, filtere auch danach
              if (subcategory) {
                const subcatLower = subcategory.toLowerCase()
                return searchText.includes(subcatLower)
              }
              return true
            }
          }
          
          return false
        })
      }
      
      console.log(`[SEARCH] Category filter applied: ${beforeFilter} -> ${watchesWithImages.length} watches`)
    } else if (subcategory) {
      // Nur Subkategorie ohne Hauptkategorie
      const subcatLower = subcategory.toLowerCase()
      watchesWithImages = watchesWithImages.filter(watch => {
        const searchText = `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
        return searchText.includes(subcatLower)
      })
    }

    // Hilfsfunktion für Booster-Priorität
    const getBoostPriority = (boosters: string[]): number => {
      if (boosters.includes('super-boost')) return 4
      if (boosters.includes('turbo-boost')) return 3
      if (boosters.includes('boost')) return 2
      return 1
    }

    // Sortierung anwenden (Booster-Priorität hat IMMER Vorrang)
    if (sortBy === 'relevance') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'ending') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        if (!a.auctionEnd && !b.auctionEnd) return 0
        if (!a.auctionEnd) return 1
        if (!b.auctionEnd) return -1
        return new Date(a.auctionEnd).getTime() - new Date(b.auctionEnd).getTime()
      })
    } else if (sortBy === 'newest') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'price-low') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return a.price - b.price
      })
    } else if (sortBy === 'price-high') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return b.price - a.price
      })
    } else if (sortBy === 'bids') {
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        const bidsA = a.bids?.length || 0
        const bidsB = b.bids?.length || 0
        return bidsB - bidsA
      })
    } else {
      // Standard: Nach Booster-Priorität sortieren
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    // Limit und Offset anwenden
    const limitedWatches = watchesWithImages.slice(offset, offset + limit)
    
    console.log(`[SEARCH] Returning ${limitedWatches.length} watches (limit: ${limit}, offset: ${offset}, total: ${watchesWithImages.length})`)
    
    return NextResponse.json({
      watches: limitedWatches,
      total: watchesWithImages.length
    })
  } catch (error: any) {
    console.error('[SEARCH] Search error:', error)
    console.error('[SEARCH] Error stack:', error?.stack)
    return NextResponse.json(
      { 
        error: 'Ein Fehler ist aufgetreten bei der Suche',
        message: error?.message || String(error),
        watches: []
      },
      { status: 500 }
    )
  }
}
