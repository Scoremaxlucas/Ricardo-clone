#!/usr/bin/env node

/**
 * Script to automatically set the correct Prisma provider based on DATABASE_URL
 * This ensures compatibility with both SQLite (local) and PostgreSQL (Vercel)
 * 
 * Node.js version for better compatibility across platforms
 */

const fs = require('fs')
const path = require('path')

const SCHEMA_FILE = path.join(__dirname, '..', 'prisma', 'schema.prisma')

function getProvider() {
  const databaseUrl = process.env.DATABASE_URL || ''
  
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set, defaulting to SQLite for local development')
    return 'sqlite'
  }
  
  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    console.log('✅ DATABASE_URL points to PostgreSQL')
    return 'postgresql'
  }
  
  if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:')) {
    console.log('✅ DATABASE_URL points to SQLite')
    return 'sqlite'
  }
  
  console.log('⚠️  Unknown DATABASE_URL format, defaulting to SQLite')
  return 'sqlite'
}

function updateSchema(provider) {
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`)
    process.exit(1)
  }
  
  let schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8')
  
  // Check current provider
  const currentProviderMatch = schemaContent.match(/provider\s*=\s*["'](sqlite|postgresql)["']/)
  const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null
  
  if (currentProvider === provider) {
    console.log(`✅ Schema already uses provider: ${provider}`)
    return
  }
  
  // Replace provider in datasource block
  schemaContent = schemaContent.replace(
    /provider\s*=\s*["'](sqlite|postgresql)["']/g,
    `provider = "${provider}"`
  )
  
  fs.writeFileSync(SCHEMA_FILE, schemaContent, 'utf8')
  console.log(`✅ Schema updated to use provider: ${provider}`)
}

try {
  const provider = getProvider()
  updateSchema(provider)
  console.log('✅ Schema preparation completed successfully')
} catch (error) {
  console.error('❌ Error preparing schema:', error)
  // Don't exit with error code - let build continue
  // Schema might already be correct
  console.log('⚠️  Continuing build despite schema preparation warning')
  process.exit(0)
}
