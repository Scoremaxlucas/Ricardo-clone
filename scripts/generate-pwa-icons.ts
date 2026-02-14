/**
 * Generate PWA icons from SVG
 * Run: npx ts-node scripts/generate-pwa-icons.ts
 */
import fs from 'fs'
import path from 'path'

// Sharp might not be available in all environments, so we'll generate SVGs
// that browsers can use, plus a simple conversion approach

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons')

function generateSvg(size: number): string {
  const rx = Math.round(size * 0.2) // 20% border radius
  const strokeWidth = Math.round(size * 0.0875) // proportional stroke
  const margin = Math.round(size * 0.3)

  const x1 = margin
  const x2 = size - margin
  const y1 = margin
  const y2 = size - margin
  const yMid = size / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0f766e"/>
  <path d="M${x1} ${y1} L${x1} ${y2} M${x1} ${yMid} L${x2} ${yMid} M${x2} ${y1} L${x2} ${y2}" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Generate SVG icons for all sizes
for (const size of ICON_SIZES) {
  const svg = generateSvg(size)
  const filename = `icon-${size}x${size}.svg`
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), svg)
  console.log(`Generated ${filename}`)
}

// Generate the main icon.svg
const mainSvg = generateSvg(512)
fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.svg'), mainSvg)
console.log('Generated icon.svg')

// Generate a maskable icon (with extra padding for safe zone)
function generateMaskableSvg(size: number): string {
  const padding = Math.round(size * 0.1) // 10% safe zone padding
  const innerSize = size - padding * 2
  const rx = Math.round(innerSize * 0.2)
  const strokeWidth = Math.round(innerSize * 0.0875)
  const margin = Math.round(innerSize * 0.3)

  const x1 = padding + margin
  const x2 = padding + innerSize - margin
  const y1 = padding + margin
  const y2 = padding + innerSize - margin
  const yMid = size / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f766e"/>
  <path d="M${x1} ${y1} L${x1} ${y2} M${x1} ${yMid} L${x2} ${yMid} M${x2} ${y1} L${x2} ${y2}" stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
}

for (const size of [192, 512]) {
  const svg = generateMaskableSvg(size)
  const filename = `icon-maskable-${size}x${size}.svg`
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), svg)
  console.log(`Generated ${filename}`)
}

// Generate apple-touch-icon (180x180)
const appleSvg = generateSvg(180)
fs.writeFileSync(path.join(OUTPUT_DIR, 'apple-touch-icon.svg'), appleSvg)
console.log('Generated apple-touch-icon.svg')

// Generate favicon.svg
fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.svg'), generateSvg(32))
console.log('Generated favicon.svg')

console.log('\nAll icons generated successfully!')
console.log('Note: For production, convert SVGs to PNGs using sharp or an online tool.')
