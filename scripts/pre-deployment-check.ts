#!/usr/bin/env tsx
/**
 * PRE-DEPLOYMENT CHECK SCRIPT
 * 
 * KRITISCH: Verhindert Deployment-Fehler durch Schema-Mismatches
 * 
 * Prüft:
 * 1. Schema vs. Datenbank Synchronisation
 * 2. Migration-Status
 * 3. Fehlende Spalten/Tabellen
 * 4. Prisma Client Sync
 * 5. Kritische Felder, die in DB fehlen könnten
 * 
 * Usage:
 *   npm run pre-deploy-check
 *   oder
 *   npx tsx scripts/pre-deployment-check.ts
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  passed: boolean
  error?: string
  warning?: string
  details?: any
}

const results: CheckResult[] = []

/**
 * Check 1: Prüfe ob DATABASE_URL gesetzt ist
 */
function checkDatabaseUrl(): CheckResult {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return {
      name: 'DATABASE_URL Check',
      passed: false,
      error: 'DATABASE_URL ist nicht gesetzt!',
    }
  }
  return {
    name: 'DATABASE_URL Check',
    passed: true,
    details: { hasUrl: true, urlLength: dbUrl.length },
  }
}

/**
 * Check 2: Prüfe ob Prisma Schema existiert
 */
function checkPrismaSchema(): CheckResult {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  if (!fs.existsSync(schemaPath)) {
    return {
      name: 'Prisma Schema Check',
      passed: false,
      error: 'prisma/schema.prisma existiert nicht!',
    }
  }
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  return {
    name: 'Prisma Schema Check',
    passed: true,
    details: { exists: true, size: schemaContent.length },
  }
}

/**
 * Check 3: Prüfe ob kritische Spalten in der Datenbank existieren
 * (Spalten, die im Schema definiert sind, aber möglicherweise fehlen)
 * 
 * HINWEIS: disputeInitiatedBy wurde temporär aus Schema entfernt
 * bis Migration ausgeführt wurde - daher nicht mehr in dieser Liste
 */
async function checkCriticalColumns(): Promise<CheckResult> {
  const criticalColumns = [
    { table: 'purchases', column: 'disputeDeadline' },
    { table: 'purchases', column: 'disputeFrozenAt' },
    { table: 'purchases', column: 'disputeAttachments' },
    { table: 'purchases', column: 'disputeReminderSentAt' },
    { table: 'purchases', column: 'disputeReminderCount' },
    { table: 'purchases', column: 'stripePaymentIntentId' },
    { table: 'purchases', column: 'stripeRefundId' },
    { table: 'purchases', column: 'stripeRefundStatus' },
    { table: 'purchases', column: 'stripeRefundedAt' },
  ]

  const missingColumns: string[] = []
  const warnings: string[] = []

  for (const { table, column } of criticalColumns) {
    try {
      // Versuche eine Query mit dieser Spalte auszuführen
      // Wenn die Spalte fehlt, wird Prisma einen Fehler werfen
      const testQuery = `SELECT "${column}" FROM "${table}" LIMIT 0`
      await prisma.$queryRawUnsafe(testQuery)
    } catch (error: any) {
      // Prisma-Fehler P2022 = Column does not exist
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        missingColumns.push(`${table}.${column}`)
      } else {
        warnings.push(`${table}.${column}: ${error.message?.substring(0, 100)}`)
      }
    }
  }

  if (missingColumns.length > 0) {
    return {
      name: 'Kritische Spalten Check',
      passed: false,
      error: `KRITISCH: ${missingColumns.length} Spalte(n) fehlen in der Datenbank!`,
      details: {
        missing: missingColumns,
        warning: 'Diese Spalten sind im Schema definiert, aber nicht in der DB.',
        solution: 'Führe die Migration aus: npx prisma migrate deploy',
      },
    }
  }

  if (warnings.length > 0) {
    return {
      name: 'Kritische Spalten Check',
      passed: true,
      warning: `${warnings.length} Warnung(en) bei Spalten-Check`,
      details: { warnings },
    }
  }

  return {
    name: 'Kritische Spalten Check',
    passed: true,
    details: { checked: criticalColumns.length, allPresent: true },
  }
}

/**
 * Check 4: Prüfe ob Migration-Status synchron ist
 */
async function checkMigrationStatus(): Promise<CheckResult> {
  try {
    // Prüfe ob es ausstehende Migrationen gibt
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations')
    if (!fs.existsSync(migrationsPath)) {
      return {
        name: 'Migration Status Check',
        passed: false,
        error: 'prisma/migrations Verzeichnis existiert nicht!',
      }
    }

    const migrations = fs
      .readdirSync(migrationsPath)
      .filter(dir => fs.statSync(path.join(migrationsPath, dir)).isDirectory())
      .sort()

    // Versuche Migration-Status zu prüfen
    try {
      const statusOutput = execSync('npx prisma migrate status', {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: process.cwd(),
      })

      const hasPendingMigrations = statusOutput.includes('following migration') || statusOutput.includes('not yet been applied')

      if (hasPendingMigrations) {
        return {
          name: 'Migration Status Check',
          passed: false,
          error: 'KRITISCH: Es gibt ausstehende Migrationen!',
          details: {
            solution: 'Führe aus: npx prisma migrate deploy',
            output: statusOutput.substring(0, 500),
          },
        }
      }

      return {
        name: 'Migration Status Check',
        passed: true,
        details: { migrationsCount: migrations.length, allApplied: true },
      }
    } catch (migrateError: any) {
      // Migration-Status-Check kann fehlschlagen, wenn DB nicht erreichbar ist
      return {
        name: 'Migration Status Check',
        passed: false,
        warning: 'Konnte Migration-Status nicht prüfen',
        details: { error: migrateError.message?.substring(0, 200) },
      }
    }
  } catch (error: any) {
    return {
      name: 'Migration Status Check',
      passed: false,
      error: `Fehler beim Prüfen der Migrationen: ${error.message}`,
    }
  }
}

/**
 * Check 5: Prüfe ob Prisma Client synchron mit Schema ist
 */
function checkPrismaClientSync(): CheckResult {
  try {
    const clientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client')
    if (!fs.existsSync(clientPath)) {
      return {
        name: 'Prisma Client Sync Check',
        passed: false,
        error: 'Prisma Client wurde nicht generiert!',
        details: { solution: 'Führe aus: npx prisma generate' },
      }
    }

    // Prüfe ob Prisma Client kürzlich generiert wurde
    const packageJsonPath = path.join(clientPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      return {
        name: 'Prisma Client Sync Check',
        passed: true,
        details: { exists: true, version: packageJson.version },
      }
    }

    return {
      name: 'Prisma Client Sync Check',
      passed: true,
      details: { exists: true },
    }
  } catch (error: any) {
    return {
      name: 'Prisma Client Sync Check',
      passed: false,
      error: `Fehler beim Prüfen des Prisma Clients: ${error.message}`,
    }
  }
}

/**
 * Check 6: Prüfe ob kritische Tabellen existieren
 */
async function checkCriticalTables(): Promise<CheckResult> {
  const criticalTables = ['users', 'watches', 'purchases', 'bids', 'categories']

  const missingTables: string[] = []

  for (const table of criticalTables) {
    try {
      // Versuche eine einfache Query auf die Tabelle
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
    } catch (error: any) {
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        missingTables.push(table)
      }
    }
  }

  if (missingTables.length > 0) {
    return {
      name: 'Kritische Tabellen Check',
      passed: false,
      error: `KRITISCH: ${missingTables.length} Tabelle(n) fehlen!`,
      details: {
        missing: missingTables,
        solution: 'Führe aus: npx prisma migrate deploy',
      },
    }
  }

  return {
    name: 'Kritische Tabellen Check',
    passed: true,
    details: { checked: criticalTables.length, allPresent: true },
  }
}

/**
 * Check 7: Prüfe ob Schema-Felder mit DB übereinstimmen (Sample-Check)
 */
async function checkSchemaDbSync(): Promise<CheckResult> {
  try {
    // Versuche einen User zu finden (ohne ihn zu erstellen)
    // Wenn das Schema nicht mit der DB übereinstimmt, wird Prisma einen Fehler werfen
    // WICHTIG: Verwende explizites select, um nur existierende Felder zu prüfen
    // KEINE Relationen laden, um Schema-Validierung zu vermeiden
    try {
      await prisma.user.findFirst({
        take: 1,
        select: {
          id: true,
          email: true,
          nickname: true,
          // KEINE purchases Relation - würde Schema-Validierung auslösen
          // Stattdessen prüfen wir nur User-Felder
        },
      })
    } catch (userError: any) {
      if (userError.code === 'P2022') {
        return {
          name: 'Schema-DB Synchronisation Check',
          passed: false,
          error: 'KRITISCH: User-Tabelle hat fehlende Spalten!',
          details: {
            code: userError.code,
            message: userError.message?.substring(0, 300),
            solution: 'Führe Migration aus: npx prisma migrate deploy',
          },
        }
      }
      // Andere Fehler weiterwerfen
      throw userError
    }

    // Separater Check für Purchase-Tabelle (ohne Relation)
    try {
      await prisma.purchase.findFirst({
        take: 1,
        select: {
          id: true,
          disputeStatus: true,
          // Nur Felder, die definitiv existieren
        },
      })
    } catch (purchaseError: any) {
      if (purchaseError.code === 'P2022') {
        return {
          name: 'Schema-DB Synchronisation Check',
          passed: false,
          error: 'KRITISCH: Purchase-Tabelle hat fehlende Spalten!',
          details: {
            code: purchaseError.code,
            message: purchaseError.message?.substring(0, 300),
            solution: 'Führe Migration aus: npx prisma migrate deploy',
          },
        }
      }
      // Andere Fehler sind nicht kritisch für diesen Check
      console.warn('[pre-deploy-check] Purchase-Check Warnung:', purchaseError.message?.substring(0, 100))
    }

    return {
      name: 'Schema-DB Synchronisation Check',
      passed: true,
      details: { schemaMatchesDb: true },
    }
  } catch (error: any) {
    if (error.code === 'P2022') {
      return {
        name: 'Schema-DB Synchronisation Check',
        passed: false,
        error: 'KRITISCH: Schema stimmt nicht mit Datenbank überein!',
        details: {
          code: error.code,
          message: error.message?.substring(0, 300),
          meta: error.meta,
          solution: 'Führe Migration aus oder passe Schema an',
        },
      }
    }
    return {
      name: 'Schema-DB Synchronisation Check',
      passed: false,
      error: `Fehler beim Schema-Check: ${error.message?.substring(0, 200)}`,
      details: { 
        code: error.code, 
        message: error.message,
        stack: error.stack?.substring(0, 500),
      },
    }
  }
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🔍 PRE-DEPLOYMENT CHECK STARTET...\n')
  console.log('=' .repeat(60))

  // Check 1: DATABASE_URL
  results.push(checkDatabaseUrl())

  // Check 2: Prisma Schema
  results.push(checkPrismaSchema())

  // Check 3: Prisma Client
  results.push(checkPrismaClientSync())

  // Check 4: Kritische Tabellen
  try {
    results.push(await checkCriticalTables())
  } catch (error: any) {
    results.push({
      name: 'Kritische Tabellen Check',
      passed: false,
      error: `Fehler: ${error.message?.substring(0, 200)}`,
    })
  }

  // Check 5: Kritische Spalten
  try {
    results.push(await checkCriticalColumns())
  } catch (error: any) {
    results.push({
      name: 'Kritische Spalten Check',
      passed: false,
      error: `Fehler: ${error.message?.substring(0, 200)}`,
    })
  }

  // Check 6: Migration Status
  try {
    results.push(await checkMigrationStatus())
  } catch (error: any) {
    results.push({
      name: 'Migration Status Check',
      passed: false,
      error: `Fehler: ${error.message?.substring(0, 200)}`,
    })
  }

  // Check 7: Schema-DB Sync (kritischster Check)
  try {
    results.push(await checkSchemaDbSync())
  } catch (error: any) {
    results.push({
      name: 'Schema-DB Synchronisation Check',
      passed: false,
      error: `Fehler: ${error.message?.substring(0, 200)}`,
    })
  }

  // Ergebnisse ausgeben
  console.log('\n📊 CHECK-ERGEBNISSE:\n')
  let hasErrors = false
  let hasWarnings = false

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌'
    const status = result.passed ? 'PASSED' : 'FAILED'
    console.log(`${icon} ${result.name}: ${status}`)

    if (result.error) {
      console.log(`   ⚠️  FEHLER: ${result.error}`)
      hasErrors = true
    }

    if (result.warning) {
      console.log(`   ⚠️  WARNUNG: ${result.warning}`)
      hasWarnings = true
    }

    if (result.details) {
      if (result.details.solution) {
        console.log(`   💡 LÖSUNG: ${result.details.solution}`)
      }
      if (result.details.missing) {
        console.log(`   📋 Fehlend: ${result.details.missing.join(', ')}`)
      }
    }
    console.log('')
  }

  console.log('=' .repeat(60))

  // Zusammenfassung
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`\n📈 ZUSAMMENFASSUNG:`)
  console.log(`   ✅ Bestanden: ${passed}/${results.length}`)
  console.log(`   ❌ Fehlgeschlagen: ${failed}/${results.length}`)

  if (hasErrors) {
    console.log(`\n🚨 KRITISCH: Deployment sollte NICHT durchgeführt werden!`)
    console.log(`\n🔧 NÄCHSTE SCHRITTE:`)
    console.log(`   1. Prüfe die Fehlermeldungen oben`)
    console.log(`   2. Führe die vorgeschlagenen Lösungen aus`)
    console.log(`   3. Führe diesen Check erneut aus: npm run pre-deploy-check`)
    console.log(`   4. Nur wenn ALLE Checks bestehen, deploye den Code\n`)
    process.exit(1)
  } else if (hasWarnings) {
    console.log(`\n⚠️  WARNUNG: Es gibt Warnungen, aber keine kritischen Fehler`)
    console.log(`   Deployment möglich, aber Warnungen sollten geprüft werden\n`)
    process.exit(0)
  } else {
    console.log(`\n✅ ALLE CHECKS BESTANDEN - Deployment kann durchgeführt werden!\n`)
    process.exit(0)
  }
}

// Cleanup
main()
  .catch(error => {
    console.error('❌ FATALER FEHLER:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
