import { PrismaClient } from '@prisma/client'
import { calculateInvoiceForSale } from '../src/lib/invoice'

const prisma = new PrismaClient()

async function createMissingInvoice() {
  try {
    const purchaseId = 'cmhkbkzzq0003viec4dl3ag6k'

    console.log(`Creating invoice for purchase ${purchaseId}...`)

    // Prüfe ob bereits eine Rechnung existiert
    const existingInvoice = await prisma.invoice.findFirst({
      where: { saleId: purchaseId },
    })

    if (existingInvoice) {
      console.log(`Invoice already exists: ${existingInvoice.invoiceNumber}`)
      return
    }

    // Erstelle Rechnung
    const invoice = await calculateInvoiceForSale(purchaseId)

    console.log(`✅ Invoice created successfully:`)
    console.log(`   Invoice Number: ${invoice.invoiceNumber}`)
    console.log(`   Seller ID: ${invoice.sellerId}`)
    console.log(`   Total: CHF ${invoice.total}`)
    console.log(`   Status: ${invoice.status}`)
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    console.error('Error details:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createMissingInvoice()
