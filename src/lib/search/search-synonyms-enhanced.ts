/**
 * Enhanced Synonym Dictionary for Search Query Expansion
 * 
 * Used to expand user search queries with related terms.
 * Supports: German, Swiss German, English, common typos, plural/singular
 */

export const enhancedSynonyms: Record<string, string[]> = {
  // ==================== SPORT & BALLSPORT ====================
  'ball': [
    'baelle', 'bälle', 'balls',
    'fussball', 'fußball', 'soccer', 'football',
    'basketball', 'volleyball', 'handball', 'tennis', 'tennisball',
    'golfball', 'rugby', 'baseball', 'softball', 'medizinball',
    'gymnastikball', 'spielball', 'sportball',
  ],
  'fussball': ['fußball', 'soccer', 'football', 'ball', 'fussbaelle', 'fußbälle'],
  'fußball': ['fussball', 'soccer', 'football', 'ball'],
  'soccer': ['fussball', 'fußball', 'football', 'ball'],
  'basketball': ['ball', 'korb', 'basket', 'baelle'],
  'volleyball': ['ball', 'netz', 'beach volleyball', 'baelle'],
  'handball': ['ball', 'baelle'],
  'tennis': ['tennisball', 'tennisschläger', 'tennisschlaeger', 'racket'],
  'golf': ['golfball', 'golfschläger', 'golfschlaeger', 'putting'],
  
  // ==================== FAHRRAD / VELO ====================
  'fahrrad': ['velo', 'bike', 'bicycle', 'rad', 'fahrräder', 'fahrraeder', 'bikes'],
  'velo': ['fahrrad', 'bike', 'bicycle', 'rad', 'velos'],
  'bike': ['fahrrad', 'velo', 'bicycle', 'rad', 'bikes'],
  'rennrad': ['roadbike', 'road bike', 'renner', 'rennvelo', 'rennräder'],
  'mountainbike': ['mtb', 'mountain bike', 'geländerad', 'mountainbikes'],
  'ebike': ['e-bike', 'elektrofahrrad', 'elektrovelo', 'pedelec', 'ebikes', 'e-bikes'],
  'e-bike': ['ebike', 'elektrofahrrad', 'elektrovelo', 'pedelec'],
  
  // ==================== COMPUTER & ELEKTRONIK ====================
  'laptop': ['notebook', 'computer', 'pc', 'laptops', 'notebooks', 'macbook', 'thinkpad'],
  'notebook': ['laptop', 'computer', 'pc', 'notebooks', 'laptops'],
  'computer': ['pc', 'rechner', 'desktop', 'computers', 'laptop', 'notebook'],
  'pc': ['computer', 'rechner', 'desktop', 'personalcomputer'],
  'macbook': ['laptop', 'notebook', 'mac', 'apple', 'macbooks'],
  'tablet': ['ipad', 'android tablet', 'tablets', 'tab'],
  'ipad': ['tablet', 'apple tablet', 'ipads'],
  
  'maus': ['mouse', 'computermaus', 'gaming maus', 'maeuse', 'mäuse'],
  'mouse': ['maus', 'computermaus', 'mice'],
  'tastatur': ['keyboard', 'tastaturen', 'keyboards', 'mechanische tastatur'],
  'keyboard': ['tastatur', 'keyboards', 'tastaturen'],
  'monitor': ['bildschirm', 'display', 'screen', 'monitore', 'monitors'],
  'bildschirm': ['monitor', 'display', 'screen', 'bildschirme'],
  
  // ==================== HANDY / SMARTPHONE ====================
  'handy': ['smartphone', 'telefon', 'phone', 'mobile', 'handys', 'mobiltelefon'],
  'smartphone': ['handy', 'phone', 'mobile', 'smartphones', 'telefon'],
  'iphone': ['apple handy', 'apple smartphone', 'iphones', 'apple phone'],
  'samsung': ['galaxy', 'samsung handy', 'samsung smartphone'],
  'galaxy': ['samsung', 'samsung galaxy'],
  
  // ==================== KAMERA / FOTO ====================
  'kamera': ['camera', 'fotoapparat', 'fotokamera', 'kameras', 'cameras'],
  'camera': ['kamera', 'fotoapparat', 'kameras'],
  'objektiv': ['lens', 'linse', 'objektive', 'lenses', 'glas'],
  'lens': ['objektiv', 'linse', 'lenses', 'objektive'],
  'drohne': ['drone', 'quadcopter', 'drohnen', 'drones', 'dji'],
  'drone': ['drohne', 'quadcopter', 'drohnen'],
  
  // ==================== MODE / KLEIDUNG ====================
  'schuhe': ['shoes', 'sneaker', 'sneakers', 'turnschuhe', 'sportschuhe', 'schuh'],
  'shoes': ['schuhe', 'sneaker', 'sneakers', 'turnschuhe'],
  'sneaker': ['schuhe', 'shoes', 'sneakers', 'turnschuhe', 'sportschuhe'],
  'sneakers': ['sneaker', 'schuhe', 'shoes', 'turnschuhe'],
  'turnschuhe': ['sneaker', 'schuhe', 'shoes', 'sneakers', 'sportschuhe'],
  
  'jacke': ['jacket', 'jacken', 'mantel', 'coat', 'jackett'],
  'jacket': ['jacke', 'jacken', 'jackets', 'mantel'],
  'hose': ['pants', 'hosen', 'jeans', 'trousers'],
  'pants': ['hose', 'hosen', 'jeans', 'trousers'],
  'jeans': ['hose', 'pants', 'denim', 'bluejeans'],
  
  'tasche': ['bag', 'taschen', 'bags', 'handtasche', 'rucksack'],
  'bag': ['tasche', 'taschen', 'bags', 'handtasche'],
  'rucksack': ['backpack', 'rucksäcke', 'rucksaecke', 'ranzen'],
  'backpack': ['rucksack', 'rucksäcke', 'bag'],
  
  // ==================== UHREN & SCHMUCK ====================
  'uhr': ['watch', 'armbanduhr', 'uhren', 'watches', 'zeitmesser'],
  'watch': ['uhr', 'armbanduhr', 'watches', 'uhren'],
  'armbanduhr': ['uhr', 'watch', 'wristwatch', 'armbanduhren'],
  'rolex': ['luxusuhr', 'schweizer uhr', 'automatikuhr'],
  'omega': ['luxusuhr', 'schweizer uhr', 'speedmaster', 'seamaster'],
  
  'schmuck': ['jewelry', 'jewellery', 'bijoux', 'accessoires'],
  'jewelry': ['schmuck', 'jewellery', 'bijoux'],
  'ring': ['ringe', 'rings', 'fingerring', 'ehering', 'trauring'],
  'kette': ['necklace', 'halskette', 'ketten', 'chain'],
  'necklace': ['kette', 'halskette', 'ketten'],
  'armband': ['bracelet', 'armbänder', 'armbaender', 'bracelets'],
  'bracelet': ['armband', 'armbänder', 'bracelets'],
  
  // ==================== AUTO & MOTORRAD ====================
  'auto': ['car', 'fahrzeug', 'wagen', 'pkw', 'autos', 'cars'],
  'car': ['auto', 'fahrzeug', 'wagen', 'cars', 'autos'],
  'fahrzeug': ['auto', 'car', 'wagen', 'vehicle', 'fahrzeuge'],
  'motorrad': ['motorcycle', 'bike', 'moped', 'motorräder', 'motorraeder'],
  'motorcycle': ['motorrad', 'bike', 'moped', 'motorcycles'],
  
  // ==================== MÖBEL / HAUSHALT ====================
  'möbel': ['moebel', 'furniture', 'einrichtung', 'mobiliar'],
  'moebel': ['möbel', 'furniture', 'einrichtung'],
  'furniture': ['möbel', 'moebel', 'einrichtung'],
  'sofa': ['couch', 'sofas', 'couches', 'sitzgarnitur'],
  'couch': ['sofa', 'sofas', 'couches'],
  'tisch': ['table', 'tische', 'tables'],
  'table': ['tisch', 'tische', 'tables'],
  'stuhl': ['chair', 'stühle', 'stuehle', 'chairs'],
  'chair': ['stuhl', 'stühle', 'chairs'],
  'lampe': ['lamp', 'leuchte', 'lampen', 'lamps', 'light'],
  'lamp': ['lampe', 'leuchte', 'lampen', 'light'],
  
  // ==================== KÜCHE / HAUSHALT ====================
  'kaffeemaschine': ['coffee maker', 'espressomaschine', 'kaffeevollautomat', 'nespresso', 'jura'],
  'staubsauger': ['vacuum', 'sauger', 'staubsaugers', 'vacuums', 'dyson', 'miele'],
  'vacuum': ['staubsauger', 'sauger', 'vacuums'],
  
  // ==================== WERKZEUG / GARTEN ====================
  'werkzeug': ['tool', 'tools', 'werkzeuge', 'handwerkzeug'],
  'tool': ['werkzeug', 'werkzeuge', 'tools'],
  'bohrmaschine': ['drill', 'bohrer', 'akkubohrer', 'schlagbohrmaschine'],
  'drill': ['bohrmaschine', 'bohrer', 'drills'],
  'garten': ['garden', 'gärten', 'gaerten', 'outdoor'],
  'garden': ['garten', 'gärten', 'gardens'],
  'rasenmäher': ['rasenmaeher', 'lawn mower', 'mäher', 'maeher'],
  'lawn mower': ['rasenmäher', 'rasenmaeher', 'mäher'],
  'grill': ['barbecue', 'bbq', 'grills', 'gasgrill', 'holzkohlegrill'],
  'barbecue': ['grill', 'bbq', 'grills'],
  'bbq': ['grill', 'barbecue', 'grills'],
  
  // ==================== GAMING ====================
  'playstation': ['ps5', 'ps4', 'ps3', 'sony', 'konsole', 'console'],
  'ps5': ['playstation', 'playstation 5', 'sony', 'konsole'],
  'ps4': ['playstation', 'playstation 4', 'sony', 'konsole'],
  'xbox': ['microsoft', 'xbox series', 'xbox one', 'konsole', 'console'],
  'nintendo': ['switch', 'wii', '3ds', 'gameboy', 'konsole'],
  'switch': ['nintendo switch', 'nintendo', 'konsole'],
  'konsole': ['console', 'playstation', 'xbox', 'nintendo', 'gaming'],
  'console': ['konsole', 'playstation', 'xbox', 'nintendo'],
  
  // ==================== MUSIK ====================
  'gitarre': ['guitar', 'gitarren', 'guitars', 'e-gitarre', 'akustikgitarre'],
  'guitar': ['gitarre', 'gitarren', 'guitars'],
  'klavier': ['piano', 'pianos', 'klaviere', 'flügel', 'fluegel'],
  'piano': ['klavier', 'pianos', 'keyboard'],
  'schlagzeug': ['drums', 'drum kit', 'percussion'],
  'drums': ['schlagzeug', 'drum kit', 'percussion'],
  
  // ==================== COMMON TYPOS ====================
  'bal': ['ball', 'bälle', 'baelle'],
  'baal': ['ball', 'bälle', 'baelle'],
  'balll': ['ball', 'bälle', 'baelle'],
  'fusbal': ['fussball', 'fußball'],
  'fussbal': ['fussball', 'fußball'],
  'basketbal': ['basketball'],
  'bicicle': ['bicycle', 'fahrrad', 'bike'],
  'bicyle': ['bicycle', 'fahrrad', 'bike'],
  'bycicle': ['bicycle', 'fahrrad', 'bike'],
  'comupter': ['computer', 'pc'],
  'compter': ['computer', 'pc'],
  'computr': ['computer', 'pc'],
  'labtop': ['laptop', 'notebook'],
  'lapop': ['laptop', 'notebook'],
  'iphon': ['iphone', 'apple'],
  'ipone': ['iphone', 'apple'],
  'samsng': ['samsung', 'galaxy'],
  'kammera': ['kamera', 'camera'],
  'camra': ['camera', 'kamera'],
  'shuh': ['schuhe', 'schuh', 'shoes'],
  'schue': ['schuhe', 'schuh', 'shoes'],
  'sneker': ['sneaker', 'sneakers'],
  'sniker': ['sneaker', 'sneakers'],
  'jaket': ['jacke', 'jacket'],
  'jakce': ['jacke', 'jacket'],
  'tisc': ['tisch', 'table'],
  'stul': ['stuhl', 'chair'],
  'plastation': ['playstation', 'ps5', 'ps4'],
  'playstaion': ['playstation', 'ps5', 'ps4'],
  'xbos': ['xbox'],
  'nintedno': ['nintendo', 'switch'],
  'gitare': ['gitarre', 'guitar'],
  'klaver': ['klavier', 'piano'],
  
  // ==================== SWISS GERMAN ====================
  'natel': ['handy', 'smartphone', 'mobile'],
  'töff': ['motorrad', 'motorcycle', 'moped'],
  'toeff': ['motorrad', 'motorcycle', 'moped'],
  'büsi': ['katze', 'cat'],
  'buesi': ['katze', 'cat'],
  'gümmeler': ['fahrrad', 'velo', 'rennrad'],
  'guemmeler': ['fahrrad', 'velo', 'rennrad'],
}

/**
 * Normalize query text (lowercase, handle umlauts, trim)
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
}

/**
 * Expand a search query with synonyms
 * Returns an object with:
 * - ftsQuery: Query string for PostgreSQL full-text search
 * - plainQuery: Plain text for trigram similarity
 * - tokens: Individual tokens for additional matching
 */
export function expandQuery(query: string): {
  ftsQuery: string
  plainQuery: string
  tokens: string[]
} {
  const normalized = normalizeQuery(query)
  const tokens = normalized.split(/\s+/).filter(t => t.length >= 2)
  
  const expandedTokens: Set<string> = new Set(tokens)
  
  // Expand each token with synonyms
  for (const token of tokens) {
    // Check for exact synonym match
    const synonyms = enhancedSynonyms[token]
    if (synonyms) {
      for (const syn of synonyms) {
        expandedTokens.add(syn)
      }
    }
    
    // Also check for variations with umlauts
    const withoutUmlauts = token
      .replace(/ae/g, 'ä')
      .replace(/oe/g, 'ö')
      .replace(/ue/g, 'ü')
    
    if (withoutUmlauts !== token && enhancedSynonyms[withoutUmlauts]) {
      for (const syn of enhancedSynonyms[withoutUmlauts]) {
        expandedTokens.add(syn)
      }
    }
    
    const withUmlauts = token
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
    
    if (withUmlauts !== token && enhancedSynonyms[withUmlauts]) {
      for (const syn of enhancedSynonyms[withUmlauts]) {
        expandedTokens.add(syn)
      }
    }
  }
  
  // Build FTS query string (OR between all terms)
  // Format: term1 | term2 | term3
  const ftsTokens = Array.from(expandedTokens).slice(0, 50) // Limit to prevent too large queries
  const ftsQuery = ftsTokens.join(' | ')
  
  // Plain query for trigram (original + synonyms)
  const plainQuery = Array.from(expandedTokens).slice(0, 30).join(' ')
  
  return {
    ftsQuery,
    plainQuery,
    tokens: Array.from(expandedTokens),
  }
}

/**
 * Check if a query might be a typo and suggest corrections
 */
export function suggestCorrections(query: string): string[] {
  const normalized = normalizeQuery(query)
  const suggestions: string[] = []
  
  // Check for known typos
  for (const [typo, corrections] of Object.entries(enhancedSynonyms)) {
    if (typo.length >= 3 && levenshteinDistance(normalized, typo) <= 2) {
      suggestions.push(...corrections.slice(0, 3))
    }
  }
  
  return Array.from(new Set(suggestions)).slice(0, 5)
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
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
