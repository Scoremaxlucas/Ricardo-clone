/**
 * Search Module Exports
 * 
 * Central export point for all search-related functionality
 */

// Search service
export { 
  searchListings, 
  getBrandCounts,
  type SearchFilters,
  type SearchSort,
  type SearchOptions,
  type SearchResult,
  type SearchResponse,
} from './listings-search'

// Search text builder
export { 
  buildSearchText, 
  normalizeText,
  extractKeywords,
} from './search-text-builder'

// Search text updates
export {
  updateWatchSearchText,
  updateWatchSearchTextDirect,
  buildSearchTextForWatch,
  batchUpdateSearchText,
  backfillAllSearchText,
} from './update-search-text'

// Synonyms
export { 
  expandQuery, 
  normalizeQuery,
  suggestCorrections,
  enhancedSynonyms,
} from './search-synonyms-enhanced'

// Keywords
export { 
  categoryKeywordsForSearch,
  defaultSearchKeywords,
} from './search-keywords'
