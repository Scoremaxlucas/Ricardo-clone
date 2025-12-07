/**
 * Restore users via API calls instead of direct database access
 * This bypasses the database quota issue by using the application API
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} catch (error) {
  console.warn('Could not load .env.local')
}

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

interface UserToRestore {
  email: string
  password: string
  name: string
  firstName?: string
  lastName?: string
  nickname?: string
  isAdmin?: boolean
}

const usersToRestore: UserToRestore[] = [
  {
    email: 'admin@helvenda.ch',
    password: 'test123',
    name: 'Admin',
    isAdmin: true,
  },
  {
    email: 'noah@test.com',
    password: 'noah123',
    name: 'Noah',
    firstName: 'Noah',
    lastName: 'Gafner',
    nickname: 'Noah',
  },
  {
    email: 'gregor@test.com',
    password: 'gregor123',
    name: 'Gregor',
    firstName: 'Gregor',
    lastName: 'Müller',
    nickname: 'Gregor',
  },
  {
    email: 'Lugas8122@gmail.com',
    password: 'test123',
    name: 'Lucas',
    firstName: 'Lucas',
    lastName: 'Rodrigues',
    nickname: 'Lucas8122',
  },
  {
    email: 'Lolcas8118@gmail.com',
    password: 'test123',
    name: 'Lucas',
    firstName: 'Lucas',
    lastName: 'Rodrigues',
    nickname: 'Lucas8118',
  },
]

async function restoreUser(user: UserToRestore) {
  try {
    console.log(`\n👤 Restoring ${user.email}...`)

    // Try to register user (will fail if exists, but that's OK)
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
      }),
    })

    const registerData = await registerResponse.json()

    if (registerResponse.ok) {
      console.log(`   ✅ User created: ${user.email}`)
    } else if (registerData.error?.includes('already exists') || registerData.error?.includes('already registered')) {
      console.log(`   ℹ️  User already exists: ${user.email}`)
      console.log(`   💡 Password may need to be reset via database`)
    } else {
      console.log(`   ⚠️  Registration failed: ${registerData.error || registerData.message}`)
    }
  } catch (error: any) {
    console.error(`   ❌ Error restoring ${user.email}:`, error.message)
  }
}

async function main() {
  console.log('🔄 RESTORING USERS VIA API...')
  console.log(`📍 Base URL: ${BASE_URL}`)
  console.log('\n⚠️  NOTE: This method uses API endpoints.')
  console.log('   If users already exist, passwords may need to be reset via database.')
  console.log('   Once database quota is available, run: npx tsx scripts/restore-all-data.ts')
  console.log('')

  for (const user of usersToRestore) {
    await restoreUser(user)
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n✅ API restore attempt complete!')
  console.log('\n📋 Next steps:')
  console.log('   1. Check if users were created successfully')
  console.log('   2. Try logging in with the credentials')
  console.log('   3. Once database quota is available, run: npx tsx scripts/restore-all-data.ts')
  console.log('      This will ensure passwords are properly set')
}

main().catch(console.error)

