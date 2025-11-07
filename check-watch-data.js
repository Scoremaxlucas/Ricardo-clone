const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const watch = await prisma.watch.findFirst({
    where: { id: 'cmhc6o6vq0001lhcodyevd1r2' }
  })
  
  console.log('\n📊 Gespeicherte Daten:')
  console.log('Images:', watch?.images?.substring(0, 100) + '...')
  console.log('Description:', watch?.description)
  console.log('Fullset:', watch?.fullset)
  console.log('Box:', watch?.box)
  console.log('Papers:', watch?.papers)
  console.log('AllLinks:', watch?.allLinks)
  console.log('LastRevision:', watch?.lastRevision)
  console.log('Accuracy:', watch?.accuracy)
  console.log('Warranty:', watch?.warranty)
  console.log('WarrantyDescription:', watch?.warrantyDescription)
  console.log('BuyNowPrice:', watch?.buyNowPrice)
}

main().finally(() => prisma.$disconnect())
