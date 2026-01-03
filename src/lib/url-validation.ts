/**
 * URL Validation Utilities
 * 
 * Prevents open redirect vulnerabilities by validating
 * that redirect URLs are safe and point to the same domain
 */

/**
 * Validates if a URL is safe for redirects
 * Only allows relative paths or URLs from the same domain
 * 
 * @param url - URL to validate
 * @param allowedDomains - Optional list of allowed domains (defaults to helvenda.ch)
 * @returns Safe URL or fallback to '/'
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  allowedDomains: string[] = ['helvenda.ch', 'www.helvenda.ch']
): string {
  // If no URL provided, return home
  if (!url || url === 'null' || url === 'undefined') {
    return '/'
  }

  // Decode URL-encoded characters
  try {
    url = decodeURIComponent(url)
  } catch (e) {
    // If decoding fails, return home
    return '/'
  }

  // Remove leading/trailing whitespace
  url = url.trim()

  // Allow relative paths (starting with /)
  if (url.startsWith('/')) {
    // Validate it's not a protocol-relative URL (//example.com)
    if (url.startsWith('//')) {
      return '/'
    }
    // Allow relative paths
    return url
  }

  // For absolute URLs, validate domain
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check if hostname matches allowed domains
    const isAllowed = allowedDomains.some(domain => {
      const domainLower = domain.toLowerCase()
      return hostname === domainLower || hostname.endsWith('.' + domainLower)
    })

    if (isAllowed) {
      // Return only the pathname + search to prevent protocol issues
      return urlObj.pathname + urlObj.search
    }

    // Domain not allowed, return home
    return '/'
  } catch (e) {
    // Invalid URL format, return home
    return '/'
  }
}

/**
 * Validates callback URL from query parameters
 * 
 * @param callbackUrl - URL from query parameter
 * @returns Safe URL for redirect
 */
export function validateCallbackUrl(callbackUrl: string | null | undefined): string {
  return validateRedirectUrl(callbackUrl)
}
