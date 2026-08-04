import { writeFileSync, mkdirSync } from 'fs'
import { renderSicTemplatePdf } from '../src/lib/sic/form-kit/render'

async function main() {
  mkdirSync('/tmp/sic-forms', { recursive: true })
  const prefilled = {
    employeeName: 'Lucas Rodrigues',
    tenantName: 'Lucas Rodrigues',
  }
  for (const id of ['employer_confirmation', 'landlord_reference'] as const) {
    const bytes = await renderSicTemplatePdf(id, prefilled)
    const path = `/tmp/sic-forms/${id}.pdf`
    writeFileSync(path, bytes)
    console.log('wrote', path, bytes.length)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
