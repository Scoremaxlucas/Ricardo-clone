import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { isApartmentPhoto } from '@/lib/rental/listing-ingest-html'

export async function fetchPageWithBrowser(url: string): Promise<{
  html: string
  imageUrls: string[]
  text: string
}> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1366, height: 768 },
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20_000 })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const imageUrls = await page.evaluate(() => {
      const images: string[] = []

      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src')
        if (src && src.startsWith('http')) images.push(src)
      })

      document.querySelectorAll('[style*="background-image"]').forEach(el => {
        const style = el.getAttribute('style') || ''
        const match = style.match(/url\(['"]?(https?:[^'")\s]+)['"]?\)/)
        if (match) images.push(match[1])
      })

      document.querySelectorAll('picture source').forEach(source => {
        const srcset = source.getAttribute('srcset') || ''
        const firstUrl = srcset.split(',')[0]?.trim().split(' ')[0]
        if (firstUrl?.startsWith('http')) images.push(firstUrl)
      })

      return Array.from(new Set(images))
    })

    const text = await page.evaluate(() => document.body.innerText)
    const html = await page.content()

    return {
      html,
      imageUrls: imageUrls.filter(isApartmentPhoto).slice(0, 15),
      text: text.substring(0, 8000),
    }
  } finally {
    await browser.close()
  }
}
