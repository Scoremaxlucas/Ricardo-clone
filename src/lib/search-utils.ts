/**
 * Search Utility Functions
 * Provides fuzzy search, text normalization, and search term expansion
 */

/**
 * Simple Levenshtein distance calculation for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
export function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - distance / maxLen
}

/**
 * Check if a string matches another with fuzzy tolerance
 * @param searchTerm The search term
 * @param target The target string to match against
 * @param threshold Minimum similarity ratio (0-1), default 0.7
 */
export function fuzzyMatch(
  searchTerm: string,
  target: string,
  threshold: number = 0.7
): boolean {
  if (!searchTerm || !target) return false

  const searchLower = searchTerm.toLowerCase().trim()
  const targetLower = target.toLowerCase().trim()

  // Exact match
  if (targetLower === searchLower) return true

  // Contains match (partial)
  if (targetLower.includes(searchLower) || searchLower.includes(targetLower)) {
    return true
  }

  // Fuzzy match
  const sim = similarity(searchLower, targetLower)
  return sim >= threshold
}

/**
 * Generate fuzzy search variants for a search term
 * Returns array of possible matches with similarity scores
 */
export function generateFuzzyVariants(searchTerm: string, candidates: string[]): Array<{ term: string; score: number }> {
  const variants: Array<{ term: string; score: number }> = []
  const searchLower = searchTerm.toLowerCase().trim()

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase().trim()

    // Skip if already exact match
    if (candidateLower === searchLower) {
      variants.push({ term: candidate, score: 1.0 })
      continue
    }

    // Calculate similarity
    const sim = similarity(searchLower, candidateLower)

    // Only include if similarity is above threshold
    if (sim >= 0.6) {
      variants.push({ term: candidate, score: sim })
    }
  }

  // Sort by score descending
  return variants.sort((a, b) => b.score - a.score)
}

/**
 * Normalize text for search (remove accents, special chars)
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Extract search terms from query (handles quoted phrases)
 */
export function extractSearchTerms(query: string): string[] {
  const terms: string[] = []
  const quotedMatches = query.match(/"([^"]+)"/g)

  if (quotedMatches) {
    // Extract quoted phrases
    for (const match of quotedMatches) {
      const phrase = match.replace(/"/g, '').trim()
      if (phrase) terms.push(phrase)
    }
    // Remove quoted parts from query
    query = query.replace(/"([^"]+)"/g, '')
  }

  // Extract remaining words
  const words = query.split(/\s+/).filter(w => w.length > 0)
  terms.push(...words)

  return terms
}

