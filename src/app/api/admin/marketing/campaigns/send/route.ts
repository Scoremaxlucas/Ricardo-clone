import { authOptions } from '@/lib/auth'
import { getHelvendaEmailTemplate } from '@/lib/email/base-template'
import { getEmailBaseUrl } from '@/lib/email/config'
import { getMarketingUnsubscribeUrl } from '@/lib/email/marketing-unsubscribe'
import { buildMarketingEmailWithProducts, type ProductCard } from '@/lib/email/marketing-template'
import { sendEmail } from '@/lib/email/sender'

const MARKETING_FROM = 'Helvenda <noreply@helvenda.ch>'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

/**
 * POST /api/admin/marketing/campaigns/send
 * Send a marketing email campaign
 * Body: { subject, content, tag?, limit?, dryRun?, campaignId? (for resend) }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const body = await request.json()
  const {
    subject,
    content,
    tag,
    limit: recipientLimit = 5000,
    dryRun = false,
    campaignId: resendCampaignId,
    includeProducts = false,
    productCount = 4,
    buttonText,
    buttonUrl,
  } = body

  if (!subject || !content) {
    return NextResponse.json(
      { error: 'Betreff und Inhalt sind erforderlich' },
      { status: 400 }
    )
  }

  // Fetch product cards if requested
  let products: ProductCard[] = []
  if (includeProducts) {
    products = await fetchActiveListings(Math.min(productCount, 8))
  }

  // If resending a failed campaign, get its failed recipients
  if (resendCampaignId) {
    return await resendFailed(resendCampaignId, subject, content, session, products, buttonText, buttonUrl)
  }

  // Build recipient query
  const contactWhere: any = { status: 'active' }
  if (tag) {
    contactWhere.tags = { contains: tag }
  }

  const contacts = await prisma.marketingContact.findMany({
    where: contactWhere,
    take: recipientLimit,
    orderBy: { createdAt: 'asc' },
  })

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: 'Keine aktiven Kontakte für dieses Segment gefunden' },
      { status: 400 }
    )
  }

  // Dry run: return preview data without sending
  if (dryRun) {
    const previewHtml = includeProducts && products.length > 0
      ? buildMarketingEmailWithProducts(subject, content, products, undefined, buttonText, buttonUrl)
      : buildEmailHtml(subject, content, undefined, buttonText, buttonUrl)
    return NextResponse.json({
      dryRun: true,
      recipientCount: contacts.length,
      subject,
      tag: tag || 'alle',
      previewHtml,
      productCount: products.length,
      sampleRecipients: contacts.slice(0, 10).map(c => c.email),
    })
  }

  // Create campaign record
  const campaign = await prisma.marketingCampaign.create({
    data: {
      subject,
      content,
      tag: tag || null,
      status: 'sending',
      totalCount: contacts.length,
      sentBy: session.user.id || session.user.email,
    },
  })

  // Create recipient records
  await prisma.marketingRecipient.createMany({
    data: contacts.map(c => ({
      campaignId: campaign.id,
      contactId: c.id,
      status: 'pending',
    })),
  })

  // Send emails in batches (background-style, but we await to track results)
  const BATCH_SIZE = 5
  const BATCH_DELAY_MS = 1000
  let sentCount = 0
  let failedCount = 0

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(async (contact) => {
        const html = includeProducts && products.length > 0
          ? buildMarketingEmailWithProducts(subject, content, products, contact.email, buttonText, buttonUrl)
          : buildEmailHtml(subject, content, contact.email, buttonText, buttonUrl)
        const result = await sendEmail({
          to: contact.email,
          subject,
          html,
          from: MARKETING_FROM,
          userId: contact.userId || undefined,
        })

        await prisma.marketingRecipient.updateMany({
          where: { campaignId: campaign.id, contactId: contact.id },
          data: {
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : null,
            error: result.success ? null : (result.error || 'Unknown error'),
          },
        })

        return result
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        sentCount++
      } else {
        failedCount++
      }
    }

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Update campaign status
  await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: {
      status: failedCount === contacts.length ? 'failed' : 'sent',
      sentCount,
      failedCount,
      sentAt: new Date(),
    },
  })

  return NextResponse.json({
    campaignId: campaign.id,
    status: 'sent',
    totalCount: contacts.length,
    sentCount,
    failedCount,
  })
}

async function resendFailed(
  campaignId: string,
  subject: string,
  content: string,
  session: any,
  products: ProductCard[] = [],
  buttonText?: string,
  buttonUrl?: string,
) {
  const failedRecipients = await prisma.marketingRecipient.findMany({
    where: { campaignId, status: 'failed' },
    include: { contact: true },
  })

  if (failedRecipients.length === 0) {
    return NextResponse.json(
      { error: 'Keine fehlgeschlagenen Empfänger für diese Kampagne' },
      { status: 400 }
    )
  }

  let sentCount = 0
  let failedCount = 0
  const BATCH_SIZE = 5
  const BATCH_DELAY_MS = 1000

  for (let i = 0; i < failedRecipients.length; i += BATCH_SIZE) {
    const batch = failedRecipients.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const html = products.length > 0
          ? buildMarketingEmailWithProducts(subject, content, products, recipient.contact.email, buttonText, buttonUrl)
          : buildEmailHtml(subject, content, recipient.contact.email, buttonText, buttonUrl)
        const result = await sendEmail({
          to: recipient.contact.email,
          subject,
          html,
          from: MARKETING_FROM,
          userId: recipient.contact.userId || undefined,
        })

        await prisma.marketingRecipient.update({
          where: { id: recipient.id },
          data: {
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : null,
            error: result.success ? null : (result.error || 'Unknown error'),
          },
        })

        return result
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        sentCount++
      } else {
        failedCount++
      }
    }

    if (i + BATCH_SIZE < failedRecipients.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Update campaign counts
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })
  if (campaign) {
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount: campaign.sentCount + sentCount,
        failedCount: Math.max(0, campaign.failedCount - sentCount),
      },
    })
  }

  return NextResponse.json({
    campaignId,
    resend: true,
    totalRetried: failedRecipients.length,
    sentCount,
    failedCount,
  })
}

/**
 * Builds the marketing email HTML using the Helvenda template.
 * Supports simple markdown-style formatting in content:
 * - **bold** → <strong>
 * - [text](url) → <a href="url">text</a>
 * - Bild: [alt](url) → <img>
 * - Newlines → <br>
 */
function buildEmailHtml(
  subject: string,
  content: string,
  recipientEmail?: string,
  customButtonText?: string,
  customButtonUrl?: string,
): string {
  const baseUrl = getEmailBaseUrl()

  let htmlContent = content
    .replace(/Bild:?\s*\[([^\]]*)\]\(([^)]+)\)/gi,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color: #0f766e; text-decoration: underline;">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')

  htmlContent = htmlContent.replace(
    /<img src="([^"]+)" alt="([^"]*)"([^>]*)>\(([^)]+)\)/g,
    '<a href="$4"><img src="$1" alt="$2"$3></a>'
  )

  let unsubscribeUrl: string | undefined
  if (recipientEmail) {
    try {
      unsubscribeUrl = getMarketingUnsubscribeUrl(recipientEmail)
    } catch {
      // Silently fail
    }
  }

  return getHelvendaEmailTemplate({
    title: subject,
    greeting: '',
    content: htmlContent,
    buttonText: customButtonText,
    buttonUrl: customButtonUrl || (customButtonText ? `${baseUrl}/sell` : undefined),
    unsubscribeUrl,
  })
}

/**
 * Fetch the latest active (not sold, not rejected) listings for product cards
 */
async function fetchActiveListings(count: number): Promise<ProductCard[]> {
  const now = new Date()

  const watches = await prisma.watch.findMany({
    where: {
      AND: [
        {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
          ],
        },
        {
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } },
          ],
        },
        {
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      price: true,
      buyNowPrice: true,
      brand: true,
      images: true,
      articleNumber: true,
    },
    orderBy: { createdAt: 'desc' },
    take: count,
  })

  return watches.map(w => {
    let imageUrl: string | null = null
    try {
      const imgs: string[] = JSON.parse(w.images)
      if (imgs.length > 0) {
        const first = imgs[0]
        // Use blob URLs directly; skip base64 in emails (too large)
        if (first.startsWith('http')) {
          imageUrl = first
        }
      }
    } catch {
      // No valid images
    }

    return {
      id: w.id,
      title: w.title,
      price: w.buyNowPrice || w.price,
      imageUrl,
      brand: w.brand,
      articleNumber: w.articleNumber,
    }
  })
}
