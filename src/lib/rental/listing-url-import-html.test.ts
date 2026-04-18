import { describe, expect, it } from 'vitest'
import { htmlToListingPlainText } from './listing-url-import-html'

describe('htmlToListingPlainText', () => {
  it('strips tags and scripts', () => {
    const html = '<html><script>evil()</script><p>Hallo <b>Welt</b></p></html>'
    expect(htmlToListingPlainText(html, 1000)).toMatch(/Hallo Welt/)
  })

  it('truncates to maxChars', () => {
    const long = `<p>${'x'.repeat(9000)}</p>`
    expect(htmlToListingPlainText(long, 50).length).toBe(50)
  })
})
