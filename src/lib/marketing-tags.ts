import { prisma } from '@/lib/prisma'

/**
 * Remove the "keine-artikel" tag from a user's marketing contact
 * when they create their first listing.
 */
export async function removeKeineArtikelTag(sellerId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { email: true },
    })
    if (!user) return

    const contact = await prisma.marketingContact.findUnique({
      where: { email: user.email.toLowerCase() },
    })
    if (!contact) return

    let tags: string[]
    try { tags = JSON.parse(contact.tags) } catch { tags = [] }

    if (!tags.includes('keine-artikel')) return

    const updatedTags = tags.filter(t => t !== 'keine-artikel')
    await prisma.marketingContact.update({
      where: { email: user.email.toLowerCase() },
      data: { tags: JSON.stringify(updatedTags) },
    })
  } catch (err) {
    console.error('[marketing-tags] Error removing keine-artikel tag:', err)
  }
}
