/** Heuristic UA match — same rules as analytics track (skip noisy automated traffic). */
export function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return false
  return /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebook|twitter|whatsapp|telegram|preview|headlesschrome|vercel-screenshot|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot/i.test(
    ua
  )
}
