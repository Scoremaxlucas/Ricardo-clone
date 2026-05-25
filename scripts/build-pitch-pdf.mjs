#!/usr/bin/env node
/**
 * Convert a Markdown file to a print-ready PDF using the Chrome binary that
 * Puppeteer already cached locally. No npm install, no external services.
 *
 * Usage:
 *   node scripts/build-pitch-pdf.mjs <input.md> [<output.pdf>]
 *
 * The script:
 *   1. reads the Markdown,
 *   2. renders a minimal Markdown -> HTML conversion (sufficient for our pitch
 *      docs: headings, tables, lists, hr, paragraphs, inline code, bold),
 *   3. wraps the HTML in a print-friendly @page A4 stylesheet,
 *   4. invokes the cached Chrome binary in headless mode with --print-to-pdf.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

function findCachedChrome() {
  const root = join(homedir(), '.cache', 'puppeteer', 'chrome')
  if (!existsSync(root)) {
    throw new Error(`No cached Chrome at ${root}. Install via: npx puppeteer browsers install chrome`)
  }
  const candidates = []
  for (const entry of readdirSafe(root)) {
    const macAppDir = join(root, entry, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
    if (existsSync(macAppDir)) candidates.push({ entry, path: macAppDir })
  }
  if (candidates.length === 0) {
    throw new Error(`No Chrome binary found under ${root}.`)
  }
  candidates.sort((a, b) => (a.entry < b.entry ? 1 : -1))
  return candidates[0].path
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderInline(text) {
  let s = escapeHtml(text)
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, b) => `<strong>${b}</strong>`)
  s = s.replace(/(^|[^\\])\*([^*]+)\*/g, (_m, lead, b) => `${lead}<em>${b}</em>`)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${href}">${label}</a>`)
  return s
}

function mdToHtml(md) {
  const lines = md.replaceAll('\r\n', '\n').split('\n')
  const out = []
  let i = 0
  let inList = null
  let inTable = false
  let tableHeaderEmitted = false
  let paraBuf = []

  function flushPara() {
    if (paraBuf.length === 0) return
    const text = paraBuf.join(' ').trim()
    if (text) out.push(`<p>${renderInline(text)}</p>`)
    paraBuf = []
  }
  function closeList() {
    if (inList) {
      out.push(inList === 'ol' ? '</ol>' : '</ul>')
      inList = null
    }
  }
  function closeTable() {
    if (inTable) {
      out.push('</tbody></table>')
      inTable = false
      tableHeaderEmitted = false
    }
  }

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw

    if (line.trim() === '') {
      flushPara()
      closeList()
      closeTable()
      i++
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushPara()
      closeList()
      closeTable()
      const level = heading[1].length
      out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`)
      i++
      continue
    }

    if (/^---+\s*$/.test(line)) {
      flushPara()
      closeList()
      closeTable()
      out.push('<hr />')
      i++
      continue
    }

    if (/^>\s?/.test(line)) {
      flushPara()
      closeList()
      closeTable()
      const block = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        block.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${renderInline(block.join(' '))}</blockquote>`)
      continue
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/)
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (ulMatch || olMatch) {
      flushPara()
      closeTable()
      const wantedTag = ulMatch ? 'ul' : 'ol'
      if (inList && inList !== wantedTag) {
        closeList()
      }
      if (!inList) {
        out.push(wantedTag === 'ol' ? '<ol>' : '<ul>')
        inList = wantedTag
      }
      const item = ulMatch ? ulMatch[1] : olMatch[2]
      out.push(`<li>${renderInline(item)}</li>`)
      i++
      continue
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      const next = lines[i + 1] ?? ''
      const isSeparator = /^\s*\|?\s*:?-{2,}.*\|/.test(next)
      flushPara()
      closeList()
      if (!inTable) {
        out.push('<table>')
        inTable = true
        tableHeaderEmitted = false
      }
      if (!tableHeaderEmitted && isSeparator) {
        out.push('<thead><tr>')
        for (const c of cells) out.push(`<th>${renderInline(c)}</th>`)
        out.push('</tr></thead><tbody>')
        tableHeaderEmitted = true
        i += 2
        continue
      }
      out.push('<tr>')
      for (const c of cells) out.push(`<td>${renderInline(c)}</td>`)
      out.push('</tr>')
      i++
      continue
    }

    paraBuf.push(line)
    i++
  }

  flushPara()
  closeList()
  closeTable()
  return out.join('\n')
}

const PRINT_CSS = `
@page {
  size: A4;
  margin: 22mm 18mm 22mm 18mm;
}
* { box-sizing: border-box; }
html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: #0d2b1f;
  font-size: 10.5pt;
  line-height: 1.55;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { color: #0d2b1f; font-weight: 700; line-height: 1.2; }
h1 { font-size: 22pt; margin: 0 0 4pt; letter-spacing: -0.01em; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; padding-bottom: 4pt; border-bottom: 1px solid #d4eee4; }
h3 { font-size: 11.5pt; margin: 14pt 0 4pt; color: #18a87c; text-transform: uppercase; letter-spacing: 0.06em; }
h4 { font-size: 11pt; margin: 10pt 0 4pt; }
p { margin: 0 0 6pt; }
ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
li { margin: 0 0 3pt; }
hr { border: none; border-top: 1px solid #d4eee4; margin: 14pt 0; }
strong { color: #0d2b1f; }
em { font-style: italic; }
a { color: #18a87c; text-decoration: none; }
code {
  background: #f5fdfb;
  border: 1px solid #d4eee4;
  border-radius: 3px;
  padding: 1px 4px;
  font-family: 'SF Mono', ui-monospace, Menlo, monospace;
  font-size: 0.92em;
}
blockquote {
  margin: 6pt 0;
  padding: 8pt 12pt;
  border-left: 3px solid #18a87c;
  background: #f5fdfb;
  border-radius: 0 4px 4px 0;
  font-style: italic;
  color: #1f5b46;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 8pt 0;
  font-size: 9.8pt;
  page-break-inside: avoid;
}
th, td {
  text-align: left;
  vertical-align: top;
  padding: 5pt 7pt;
  border-bottom: 1px solid #e8efeb;
}
th {
  background: #f5fdfb;
  font-weight: 600;
  color: #0d2b1f;
  border-bottom: 2px solid #18a87c;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 8.6pt;
}
tr { page-break-inside: avoid; }
section, .section { page-break-inside: auto; }
h1, h2, h3 { page-break-after: avoid; }
.brandbar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0 0 16pt;
  padding-bottom: 6pt;
  border-bottom: 2px solid #18a87c;
}
.brandbar .left { font-weight: 800; color: #0d2b1f; font-size: 12pt; letter-spacing: -0.01em; }
.brandbar .right { font-size: 9pt; color: #5a7a6e; }
.footnote { color: #5a7a6e; font-size: 8.4pt; margin-top: 14pt; text-align: center; }
`

function buildHtml(title, body) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<div class="brandbar"><span class="left">Helvenda Wohnungen</span><span class="right">Score-Max GmbH · Zollikerberg</span></div>
${body}
<p class="footnote">Score-Max GmbH · In der Hauswiese 2 · CH-8125 Zollikerberg · support@helvenda.ch · https://wohnen.helvenda.ch</p>
</body>
</html>`
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/build-pitch-pdf.mjs <input.md> [<output.pdf>]')
  process.exit(2)
}
const inputPath = resolve(args[0])
const outputPath = args[1] ? resolve(args[1]) : inputPath.replace(/\.md$/i, '.pdf')

const md = readFileSync(inputPath, 'utf-8')
const body = mdToHtml(md)
const titleMatch = md.match(/^#\s+(.+)$/m)
const title = titleMatch ? titleMatch[1].trim() : basename(inputPath)
const html = buildHtml(title, body)

const tmpDir = mkdtempSync(join(tmpdir(), 'pitch-pdf-'))
const htmlPath = join(tmpDir, 'pitch.html')
writeFileSync(htmlPath, html, 'utf-8')

const chromeBin = findCachedChrome()

const fileUrl = pathToFileURL(htmlPath).toString()
const chromeArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-pdf-header-footer',
  '--virtual-time-budget=2000',
  `--print-to-pdf=${outputPath}`,
  fileUrl,
]

console.log(`[pitch-pdf] using chrome at: ${chromeBin}`)
console.log(`[pitch-pdf] writing pdf:    ${outputPath}`)

execFileSync(chromeBin, chromeArgs, { stdio: 'inherit' })
console.log(`[pitch-pdf] done.`)
