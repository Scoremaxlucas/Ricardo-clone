#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

console.log('Prüfe Prisma Client...\n')

const prisma = new PrismaClient()

// Prüfe ob contactRequest verfügbar ist
if (prisma.contactRequest) {
  console.log('✅ ContactRequest Modell ist verfügbar')
  console.log(
    'Verfügbare Methoden:',
    Object.keys(prisma.contactRequest).slice(0, 5).join(', '),
    '...'
  )

  // Teste eine Query
  prisma.contactRequest
    .findMany({ take: 1 })
    .then(result => {
      console.log('✅ Query erfolgreich, gefunden:', result.length, 'Einträge')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Query fehlgeschlagen:', error.message)
      process.exit(1)
    })
} else {
  console.error('❌ ContactRequest Modell ist NICHT verfügbar!')
  console.log(
    'Verfügbare Modelle:',
    Object.keys(prisma)
      .filter(key => !key.startsWith('$'))
      .join(', ')
  )
  console.log('\nBitte führen Sie aus:')
  console.log('  1. npx prisma generate')
  console.log('  2. Server neu starten (npm run dev)')
  process.exit(1)
}
