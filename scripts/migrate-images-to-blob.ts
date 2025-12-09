/**
 * Migration Script: Base64 Images zu Vercel Blob Storage
 *
 * Dieses Script migriert alle Base64-Bilder in der Datenbank zu Vercel Blob Storage.
 *
 * Usage:
 *   npm run migrate:images-to-blob
 *
 * Oder direkt:
 *   tsx scripts/migrate-images-to-blob.ts
 */

import { prisma } from '../src/lib/prisma'
import { uploadImagesToBlob, isBlobUrl } from '../src/lib/blob-storage'

interface MigrationStats {
  total: number
  migrated: number
  skipped: number
  failed: number
  errors: string[]
}

async function migrateWatchImages() {
  console.log('🚀 Starting image migration to Vercel Blob Storage...\n')

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  try {
    // Hole alle Watches mit Bildern
    const watches = await prisma.watch.findMany({
      where: {
        images: {
          not: null,
        },
      },
      select: {
        id: true,
        images: true,
        title: true,
      },
    })

    stats.total = watches.length
    console.log(`📦 Found ${stats.total} watches with images\n`)

    // Migriere in Batches von 10 (um Rate Limits zu vermeiden)
    const batchSize = 10
    for (let i = 0; i < watches.length; i += batchSize) {
      const batch = watches.slice(i, i + batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(watches.length / batchSize)}...`)

      await Promise.all(
        batch.map(async (watch) => {
          try {
            if (!watch.images) {
              stats.skipped++
              return
            }

            // Parse images
            let images: string[] = []
            try {
              images = typeof watch.images === 'string' ? JSON.parse(watch.images) : watch.images
            } catch (error) {
              console.error(`❌ Error parsing images for watch ${watch.id}:`, error)
              stats.failed++
              stats.errors.push(`Watch ${watch.id}: Parse error`)
              return
            }

            if (!Array.isArray(images) || images.length === 0) {
              stats.skipped++
              return
            }

            // Prüfe ob bereits Blob URLs vorhanden sind
            const hasBase64 = images.some((img: string) =>
              typeof img === 'string' && img.startsWith('data:image/')
            )
            const allBlobUrls = images.every((img: string) =>
              typeof img === 'string' && (isBlobUrl(img) || img.startsWith('http'))
            )

            if (!hasBase64 && allBlobUrls) {
              // Bereits migriert
              stats.skipped++
              console.log(`⏭️  Watch ${watch.id} already migrated, skipping...`)
              return
            }

            // Trenne Base64 von URLs
            const base64Images = images.filter((img: string) =>
              typeof img === 'string' && img.startsWith('data:image/')
            )
            const existingUrls = images.filter((img: string) =>
              typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
            )

            if (base64Images.length === 0) {
              stats.skipped++
              return
            }

            // Upload Base64-Bilder zu Blob Storage
            console.log(`📤 Uploading ${base64Images.length} images for watch ${watch.id} (${watch.title?.substring(0, 30)}...)...`)

            const basePath = `watches/${watch.id}`
            const blobUrls = await uploadImagesToBlob(base64Images, basePath)

            // Kombiniere neue Blob URLs mit bestehenden URLs
            const finalUrls = [...existingUrls, ...blobUrls]

            // Update Datenbank
            await prisma.watch.update({
              where: { id: watch.id },
              data: {
                images: JSON.stringify(finalUrls),
              },
            })

            stats.migrated++
            console.log(`✅ Migrated watch ${watch.id}: ${base64Images.length} images → ${blobUrls.length} Blob URLs`)
          } catch (error: any) {
            stats.failed++
            const errorMsg = `Watch ${watch.id}: ${error.message || 'Unknown error'}`
            stats.errors.push(errorMsg)
            console.error(`❌ Error migrating watch ${watch.id}:`, error)
          }
        })
      )

      // Kurze Pause zwischen Batches um Rate Limits zu vermeiden
      if (i + batchSize < watches.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Migriere Profilbilder
    console.log('\n\n👤 Migrating profile images...\n')

    const users = await prisma.user.findMany({
      where: {
        image: {
          not: null,
        },
      },
      select: {
        id: true,
        image: true,
        email: true,
      },
    })

    console.log(`📦 Found ${users.length} users with profile images\n`)

    for (const user of users) {
      try {
        if (!user.image) {
          stats.skipped++
          continue
        }

        // Prüfe ob bereits Blob URL
        if (isBlobUrl(user.image) || user.image.startsWith('http://') || user.image.startsWith('https://')) {
          stats.skipped++
          continue
        }

        // Upload zu Blob Storage
        if (user.image.startsWith('data:image/')) {
          console.log(`📤 Uploading profile image for user ${user.id} (${user.email})...`)

          const blobPath = `profiles/${user.id}/profile.jpg`
          const { uploadImageToBlob } = await import('../src/lib/blob-storage')
          const blobUrl = await uploadImageToBlob(user.image, blobPath)

          // Update Datenbank
          await prisma.user.update({
            where: { id: user.id },
            data: {
              image: blobUrl,
            },
          })

          stats.migrated++
          console.log(`✅ Migrated profile image for user ${user.id}`)
        }
      } catch (error: any) {
        stats.failed++
        const errorMsg = `User ${user.id}: ${error.message || 'Unknown error'}`
        stats.errors.push(errorMsg)
        console.error(`❌ Error migrating user ${user.id}:`, error)
      }
    }

    // Zusammenfassung
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))
    console.log(`Total items:     ${stats.total + users.length}`)
    console.log(`✅ Migrated:     ${stats.migrated}`)
    console.log(`⏭️  Skipped:      ${stats.skipped}`)
    console.log(`❌ Failed:       ${stats.failed}`)

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:')
      stats.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`))
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`)
      }
    }

    console.log('\n✅ Migration completed!')
  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Führe Migration aus
migrateWatchImages()
  .then(() => {
    console.log('\n🎉 Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })

