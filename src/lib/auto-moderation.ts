/**
 * Automatische Moderation: Keyword-Filter und Spam-Erkennung
 */

// Spam-Keywords (können später erweitert werden)
const SPAM_KEYWORDS = [
  'viagra',
  'cialis',
  'casino',
  'poker',
  'lottery',
  'winner',
  'free money',
  'click here',
  'buy now',
  'limited time',
  'act now',
  'urgent',
  'guaranteed',
  'no risk',
  'make money fast',
  'work from home',
  'get rich',
  'earn $',
  'bitcoin investment',
  'crypto',
  'nigerian prince',
  'inheritance',
  'lottery winner',
]

// Unangemessene Keywords
const INAPPROPRIATE_KEYWORDS = ['porn', 'xxx', 'adult', 'explicit', 'nsfw']

// Betrugs-Keywords
const FRAUD_KEYWORDS = ['fake', 'replica', 'counterfeit', 'knockoff', 'imitation', 'scam', 'fraud']

export interface ModerationResult {
  flagged: boolean
  reason?: string
  severity: 'low' | 'medium' | 'high'
  keywords: string[]
}

/**
 * Prüft einen Text auf problematische Keywords
 */
export function checkKeywords(text: string): ModerationResult {
  const lowerText = text.toLowerCase()
  const foundKeywords: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'
  let reason: string | undefined

  // Prüfe auf Spam
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword)
      severity = 'medium'
      reason = 'Spam-Verdacht'
    }
  }

  // Prüfe auf unangemessene Inhalte
  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword)
      severity = 'high'
      reason = 'Unangemessener Inhalt'
    }
  }

  // Prüfe auf Betrug
  for (const keyword of FRAUD_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword)
      severity = 'high'
      reason = 'Betrugs-Verdacht'
    }
  }

  return {
    flagged: foundKeywords.length > 0,
    reason,
    severity,
    keywords: foundKeywords,
  }
}

/**
 * Prüft ein komplettes Angebot auf Moderation-Probleme
 */
export function moderateWatch(watch: {
  title: string
  description: string | null
  brand: string
  model: string
}): ModerationResult {
  const titleResult = checkKeywords(watch.title)
  const descriptionResult = checkKeywords(watch.description || '')
  const brandResult = checkKeywords(watch.brand)
  const modelResult = checkKeywords(watch.model)

  const allKeywords = [
    ...titleResult.keywords,
    ...descriptionResult.keywords,
    ...brandResult.keywords,
    ...modelResult.keywords,
  ]

  // Bestimme höchste Severity
  const severities = [
    titleResult.severity,
    descriptionResult.severity,
    brandResult.severity,
    modelResult.severity,
  ]
  const severityOrder = { low: 0, medium: 1, high: 2 }
  const maxSeverity = severities.reduce(
    (max, s) => (severityOrder[s] > severityOrder[max] ? s : max),
    'low' as 'low' | 'medium' | 'high'
  )

  return {
    flagged: allKeywords.length > 0,
    reason:
      titleResult.reason || descriptionResult.reason || brandResult.reason || modelResult.reason,
    severity: maxSeverity,
    keywords: [...new Set(allKeywords)], // Entferne Duplikate
  }
}
